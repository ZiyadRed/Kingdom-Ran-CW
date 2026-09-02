#!/usr/bin/env python3
"""Extract verbatim Japanese source text from the Kingdom Ran game data snapshot.

MAINTAINER ACTION ONLY. This script is deliberately NOT wired into `prebuild`:
normal builds and CI must never require the original game files. It reads a
verified game-data snapshot and writes the committed raw artifacts under
data/source/ja/, which are then the only input the ordinary build needs
(see scripts/localization/build_locale_artifacts.mjs).

Pipeline position:

    game snapshot  ->  extract_ja_text.py  ->  data/source/ja/*.raw.json   (committed)
    committed raw  ->  build_locale_artifacts.mjs  ->  data/generated/**

Everything is validated before anything is written, and each file is written to
a temporary path and atomically replaced, so a failed run can never leave a
partial or half-updated artifact behind.

Usage:
    python scripts/localization/extract_ja_text.py <source-root>
    python scripts/localization/extract_ja_text.py            # uses RANHQ_GAME_DATA
    python scripts/localization/extract_ja_text.py --verify   # provenance source, no writes

Exit codes: 0 = artifacts written/verified, 1 = validation failed (nothing written).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import struct
import sys
import tempfile
from pathlib import Path

# Windows PowerShell consoles often default to cp1252. Source strings are
# intentionally verbatim Japanese, so diagnostics must not crash while
# printing a valid discrepancy report.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")

try:
    import msgpack
except ImportError:  # pragma: no cover - environment guard
    sys.exit("FATAL: the 'msgpack' package is required (pip install msgpack)")

# ── Snapshot contract ────────────────────────────────────────────────────────
# The master snapshot hash is the SHA-256 of a 405-byte UTF-8 manifest built as
# "<name>:<UPPERCASE_SHA256>\n" for masters_001..005, in order.
MASTER_FILES = [f"masters_00{i}.bin" for i in range(1, 6)]
EXPECTED_MASTER_SHA256 = {
    "masters_001.bin": "E054EDB9D12229933621BAA2C9D40E5AB2A06DC0859C75FC46ECCA2B08222A8A",
    "masters_002.bin": "9D98E3326302178D0FBE9348A0D8662B248DFF5FAFE0CC12C6F7D939616CC179",
    "masters_003.bin": "1BC784A61CD7A6FFB1CE852DA90E88CD1C0FAC2BBD111C37C10722E91A668B04",
    "masters_004.bin": "5D53C8835C5B2CDDE05FD8B415FBC5EF5FF26A8600E8A2912E047D69A22F73E7",
    "masters_005.bin": "10C71F47F31FB9AEE74C02C91ADBB232750008FDF4F799E08B3D3E2123766E72",
}
EXPECTED_SNAPSHOT_SHA256 = (
    "59408FDF1D9E5A6B0A18DA30D4175EE90B2D0B2554E7D17D53FFD04B91A931E0"
)
EXPECTED_MANIFEST_BYTES = 405

# ── STBL tables ──────────────────────────────────────────────────────────────
# The historical master snapshot hash does NOT cover the STBL files, so each one
# is hashed independently and its hash recorded in the artifact and provenance.
STBL_TABLES = [
    # (stbl filename, output artifact, expected entry count)
    ("MsgUnionConquestSkillName.stbl", "skill_name.raw.json", 869),
    ("MsgUnionConquestSkillDesc.stbl", "skill_desc.raw.json", 869),
    ("MsgUnitGeneralRubyName.stbl", "general_ruby.raw.json", 609),
    ("MsgUnitGeneralName.stbl", "general_name.raw.json", 609),
    ("MsgUnionConquestSkillEffectDesc.stbl", "skill_effect_desc.raw.json", 1020),
]

RAW_SCHEMA = "ranhq.stbl_raw/1"
SKILL_TABLE = "mstUnionConquestSkills"
DECODER_METADATA = {
    "name": "extract_ja_text.py",
    "version": "1",
    "rawSchema": RAW_SCHEMA,
    "stblLayout": "STBL header + little-endian offset table + NUL-terminated UTF-8 strings",
    "masterDecoder": "msgpack master packets (masters_001.bin..masters_005.bin)",
}

REPO_ROOT = Path(__file__).resolve().parents[2]


class ValidationError(Exception):
    """Raised when the snapshot or its cross-checks fail. Nothing is written."""


# ── Hashing ──────────────────────────────────────────────────────────────────


def sha256_upper(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest().upper()


def verify_snapshot(decrypted_dir: Path) -> dict:
    """Verify the five master hashes and reproduce the 405-byte manifest hash."""
    manifest_lines = []
    per_file = {}

    for name in MASTER_FILES:
        path = decrypted_dir / name
        if not path.is_file():
            raise ValidationError(f"missing master file: {path}")
        digest = sha256_upper(path.read_bytes())
        expected = EXPECTED_MASTER_SHA256[name]
        if digest != expected:
            raise ValidationError(
                f"{name} SHA-256 mismatch\n  actual:   {digest}\n  expected: {expected}"
            )
        per_file[name] = digest
        manifest_lines.append(f"{name}:{digest}\n")

    manifest = "".join(manifest_lines).encode("utf-8")
    if len(manifest) != EXPECTED_MANIFEST_BYTES:
        raise ValidationError(
            f"manifest is {len(manifest)} bytes, expected {EXPECTED_MANIFEST_BYTES}"
        )

    snapshot = sha256_upper(manifest)
    if snapshot != EXPECTED_SNAPSHOT_SHA256:
        raise ValidationError(
            "master snapshot hash mismatch — refusing to extract against a "
            f"different snapshot\n  actual:   {snapshot}\n  expected: {EXPECTED_SNAPSHOT_SHA256}"
        )

    return {"files": per_file, "manifestBytes": len(manifest), "snapshot": snapshot}


# ── MessagePack masters ──────────────────────────────────────────────────────


def load_masters(decrypted_dir: Path) -> dict:
    """Decode each master packet independently; later files overwrite tables.

    packet["master"] maps table name -> list of row dicts. Duplicate table names
    are REPLACED, never concatenated.
    """
    tables: dict = {}
    for name in MASTER_FILES:
        packet = msgpack.unpackb((decrypted_dir / name).read_bytes(), raw=False)
        tables.update(packet.get("master", {}) or {})
    if SKILL_TABLE not in tables:
        raise ValidationError(f"master table {SKILL_TABLE} not found in snapshot")
    return tables


# ── STBL decoder ─────────────────────────────────────────────────────────────


def decode_stbl(path: Path) -> list[str]:
    """Decode a STBL string table into a list indexed exactly as the source.

    Layout: "STBL" | 4-byte unused | uint32 count | uint32 string base |
            count x uint32 offsets, then NUL-terminated UTF-8 at base + offset.

    Strings are returned verbatim — no trimming, no Unicode normalization, no
    placeholder rewriting. Literal "null" entries and empty strings are kept.
    """
    data = path.read_bytes()

    if len(data) < 16:
        raise ValidationError(f"{path.name}: file too small to be a STBL ({len(data)} bytes)")
    if data[:4] != b"STBL":
        raise ValidationError(f"{path.name}: bad magic {data[:4]!r}, expected b'STBL'")

    count, base = struct.unpack_from("<II", data, 8)

    table_end = 16 + count * 4
    if table_end > len(data):
        raise ValidationError(
            f"{path.name}: offset table overruns file (needs {table_end}, have {len(data)})"
        )
    if base > len(data):
        raise ValidationError(
            f"{path.name}: string base {base} is past end of file ({len(data)})"
        )

    offsets = struct.unpack_from(f"<{count}I", data, 16)

    values: list[str] = []
    for index, offset in enumerate(offsets):
        start = base + offset
        if start >= len(data):
            raise ValidationError(
                f"{path.name}: entry {index} starts at {start}, past end of file ({len(data)})"
            )
        end = data.find(b"\x00", start)
        if end == -1:
            raise ValidationError(f"{path.name}: entry {index} is not NUL-terminated")
        try:
            values.append(data[start:end].decode("utf-8"))
        except UnicodeDecodeError as exc:
            raise ValidationError(f"{path.name}: entry {index} is not valid UTF-8 ({exc})")

    return values


# ── Cross-checks against the Phase 2 map ─────────────────────────────────────


def cross_check(masters: dict, names: list[str], descs: list[str]) -> dict:
    """Verify every deterministic Phase 2 mapping against the master tables."""
    skill_map = json.loads(
        (REPO_ROOT / "data/source/cw_skills.map.json").read_text(encoding="utf-8")
    )
    entries = skill_map.get("skills") or {}
    by_id = {row["id"]: row for row in masters[SKILL_TABLE]}

    errors: list[str] = []
    discrepancies: list[dict] = []
    checked = 0
    ambiguous_keys: list[str] = []

    # Project name_jp per skill row, for the discrepancy report only.
    project_names: dict[str, str] = {}
    chars_dir = REPO_ROOT / "data/characters"
    for f in sorted(chars_dir.glob("*.json")):
        for c in json.loads(f.read_text(encoding="utf-8")):
            for i, s in enumerate(c.get("skills") or []):
                project_names[f"{c['id']}#{i}"] = s.get("name_jp")

    for key, entry in entries.items():
        status = entry.get("status")

        if status == "ambiguous":
            ambiguous_keys.append(key)
            if entry.get("skillId") is not None:
                errors.append(f"{key}: ambiguous row must keep skillId null")
            for cand in entry.get("candidates") or []:
                cid, ctext = cand.get("skillId"), cand.get("textId")
                row = by_id.get(cid)
                if row is None:
                    errors.append(f"{key}: candidate skillId {cid} not found in {SKILL_TABLE}")
                    continue
                if row.get("textId") != ctext:
                    errors.append(
                        f"{key}: candidate {cid} textId {ctext} != master {row.get('textId')}"
                    )
                elif not (0 <= ctext < len(names)) or not (0 <= ctext < len(descs)):
                    errors.append(f"{key}: candidate {cid} textId {ctext} out of STBL range")
            continue

        if status not in ("exact", "resolved"):
            errors.append(f"{key}: unexpected status {status!r}")
            continue

        checked += 1
        skill_id, text_id = entry.get("skillId"), entry.get("textId")

        if skill_id is None or text_id is None:
            errors.append(f"{key}: deterministic row has null skillId/textId")
            continue

        row = by_id.get(skill_id)
        if row is None:
            errors.append(f"{key}: skillId {skill_id} not found in {SKILL_TABLE}")
            continue
        if row.get("id") != skill_id:
            errors.append(f"{key}: master row id {row.get('id')} != skillId {skill_id}")
        if row.get("textId") != text_id:
            errors.append(
                f"{key}: master textId {row.get('textId')} != mapping textId {text_id}"
            )
            continue

        if not (0 <= text_id < len(names)):
            errors.append(f"{key}: textId {text_id} out of SkillName range (0..{len(names) - 1})")
            continue
        if not (0 <= text_id < len(descs)):
            errors.append(f"{key}: textId {text_id} out of SkillDesc range (0..{len(descs) - 1})")
            continue

        source_name, source_desc = names[text_id], descs[text_id]
        if not source_name.strip():
            errors.append(f"{key}: source name at textId {text_id} is empty")
        if not source_desc.strip():
            errors.append(f"{key}: source desc at textId {text_id} is empty")

        stored = entry.get("sourceNameJp")
        if stored != source_name:
            errors.append(
                f"{key}: sourceNameJp {stored!r} != STBL[{text_id}] {source_name!r}"
            )

        # Project vs source naming differences are EXPECTED for resolved rows.
        # They are reported, never corrected — project names are not rewritten.
        project = project_names.get(key)
        if project is not None and project != source_name:
            discrepancies.append(
                {"key": key, "skillId": skill_id, "textId": text_id,
                 "project": project, "source": source_name}
            )

    if errors:
        raise ValidationError(
            f"{len(errors)} cross-check failure(s):\n  " + "\n  ".join(errors[:40])
        )

    return {
        "checked": checked,
        "ambiguous": sorted(ambiguous_keys),
        "discrepancies": discrepancies,
    }


# ── General-name index (skill-description placeholders) ──────────────────────


def build_general_index(masters: dict, general_names: list[str]) -> dict:
    """Map every characterId to its Japanese name, for `{-N:characterId}`.

    Skill descriptions reference other generals with a placeholder whose first
    field is a 1-based occurrence ordinal and whose second field is a
    characterId, e.g. 「{-1:261}」.

    The name table is indexed by `mstUnitGenerals.id`, NOT by characterId. The
    two coincide for many older rows, which makes a direct lookup look correct
    while silently returning the wrong general: characterId 261 is 蒼仁, but
    name[261] is 傅抵. Newer characters expose the bug outright — name[258] is
    empty where 蒼淡 is expected.

    Verified against the project's own English effect text: resolving through
    the row id agrees with the ally named in English 127 times and disagrees 13,
    where every disagreement is either a kanji variant of the same person
    (麻鉱/麻礦) or an English line naming an army rather than the ally. Direct
    indexing agrees once and disagrees 110 times.
    """
    index: dict[str, str] = {}
    missing: list[int] = []

    for row in masters["mstUnitGenerals"]:
        character_id = row.get("characterId")
        row_id = row.get("id")
        if character_id is None or row_id is None:
            continue
        if not (0 <= row_id < len(general_names)):
            missing.append(character_id)
            continue
        value = general_names[row_id].strip()
        if not value:
            missing.append(character_id)
            continue
        index[str(character_id)] = value

    if not index:
        raise ValidationError("general-name index is empty")

    return {"names": index, "missingCharacterIds": sorted(missing)}


# ── Atomic output ────────────────────────────────────────────────────────────


def write_atomic(path: Path, payload: dict) -> None:
    """Serialize to a temp file in the destination dir, then atomically replace."""
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def update_provenance(snapshot: dict, stbl_meta: list[dict], decrypted_dir: Path) -> Path:
    """Record STBL hashes and counts, preserving all existing provenance."""
    path = REPO_ROOT / "data/source/_provenance.json"
    prov = json.loads(path.read_text(encoding="utf-8"))

    prov["sourceSnapshot"]["manifestSha256"] = snapshot["snapshot"]
    prov["sourceSnapshot"]["snapshotLabel"] = "v8.6.0_20260826_c23b0a22"
    prov["sourceSnapshot"]["snapshotDate"] = "2026-08-26"
    prov["sourceSnapshot"]["sourceRoot"] = str(decrypted_dir)
    prov["sourceSnapshot"]["decoder"] = DECODER_METADATA
    prov["sourceSnapshot"]["masterFiles"] = snapshot["files"]
    prov["stblTables"] = {
        m["table"]: {"sha256": m["sha256"], "entries": m["entries"]} for m in stbl_meta
    }

    write_atomic(path, prov)
    return path


# ── Main ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract verbatim Japanese source text from a verified game snapshot."
    )
    parser.add_argument(
        "source_root",
        nargs="?",
        default=os.environ.get("RANHQ_GAME_DATA"),
        help="game data root containing decrypted/ (or set RANHQ_GAME_DATA)",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="re-extract in memory and verify committed artifacts without writing",
    )
    args = parser.parse_args()

    source_arg = args.source_root
    if args.verify and not source_arg:
        provenance_path = REPO_ROOT / "data/source/_provenance.json"
        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        source_arg = provenance.get("sourceSnapshot", {}).get("sourceRoot")

    if not source_arg:
        parser.error(
            "no source root given: pass it as an argument or set RANHQ_GAME_DATA"
        )

    source_root = Path(source_arg).expanduser().resolve()
    # Provenance records the exact decrypted directory, while maintainer mode
    # historically accepts its parent. Supporting both keeps --verify portable
    # and does not weaken the snapshot hash contract below.
    decrypted = source_root if (source_root / "master").is_dir() else source_root / "decrypted"
    master_dir = decrypted / "master"

    if not master_dir.is_dir():
        raise ValidationError(f"expected STBL directory not found: {master_dir}")

    print(f"source root : {source_root}")

    # 1-3. Verify the snapshot before reading anything else.
    snapshot = verify_snapshot(decrypted)
    for name, digest in snapshot["files"].items():
        print(f"  {name}  {digest}  OK")
    print(f"  manifest {snapshot['manifestBytes']} bytes -> {snapshot['snapshot']}  OK")

    # 4. MessagePack masters.
    masters = load_masters(decrypted)
    print(f"masters     : {len(masters)} tables, "
          f"{len(masters[SKILL_TABLE])} rows in {SKILL_TABLE}")

    # 5-7. Decode, hash and count-check every STBL.
    decoded: dict[str, list[str]] = {}
    stbl_meta: list[dict] = []
    for table, artifact, expected in STBL_TABLES:
        path = master_dir / table
        if not path.is_file():
            raise ValidationError(f"missing STBL file: {path}")
        values = decode_stbl(path)
        if len(values) != expected:
            raise ValidationError(
                f"{table}: {len(values)} entries, expected {expected}"
            )
        digest = sha256_upper(path.read_bytes())
        decoded[table] = values
        stbl_meta.append(
            {"table": table, "artifact": artifact, "sha256": digest, "entries": len(values)}
        )
        print(f"  {table:<40} {len(values):>5} entries  {digest}")

    # 8. Cross-check the Phase 2 map against the master skill table.
    report = cross_check(
        masters,
        decoded["MsgUnionConquestSkillName.stbl"],
        decoded["MsgUnionConquestSkillDesc.stbl"],
    )
    print(f"cross-check : {report['checked']} deterministic rows OK, "
          f"{len(report['ambiguous'])} ambiguous preserved, "
          f"{len(report['discrepancies'])} project/source name discrepancy(ies)")
    for d in report["discrepancies"]:
        print(f"    {d['key']}: project {d['project']!r} vs source {d['source']!r} "
              f"(skillId {d['skillId']}, textId {d['textId']})")

    # 8b. Resolve the characterId -> Japanese name index used by placeholders.
    general_index = build_general_index(
        masters, decoded["MsgUnitGeneralName.stbl"]
    )
    print(f"general idx : {len(general_index['names'])} characterId -> name, "
          f"{len(general_index['missingCharacterIds'])} without a source name")

    # 9. All validation passed — construct every artifact in memory first.
    out_dir = REPO_ROOT / "data/source/ja"
    artifacts: list[tuple[Path, dict]] = []
    for meta in stbl_meta:
        target = out_dir / meta["artifact"]
        artifacts.append((target, {
            "_meta": {
                "schema": RAW_SCHEMA,
                "table": meta["table"],
                "sha256": meta["sha256"],
                "entries": meta["entries"],
            },
            "values": decoded[meta["table"]],
        }))

    general_map = REPO_ROOT / "data/source/general_names.map.json"
    artifacts.append((general_map, {
        "_schema": "ranhq.general_names/1",
        "_note": (
            "characterId -> Japanese general name, for {-N:characterId} "
            "placeholders in skill descriptions. Indexed through "
            "mstUnitGenerals.id, not characterId - see build_general_index()."
        ),
        "sourceTable": "MsgUnitGeneralName.stbl",
        **general_index,
    }))

    provenance_path = REPO_ROOT / "data/source/_provenance.json"
    expected_provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
    expected_provenance["sourceSnapshot"]["manifestSha256"] = snapshot["snapshot"]
    expected_provenance["sourceSnapshot"]["snapshotLabel"] = "v8.6.0_20260826_c23b0a22"
    expected_provenance["sourceSnapshot"]["snapshotDate"] = "2026-08-26"
    expected_provenance["sourceSnapshot"]["sourceRoot"] = str(decrypted)
    expected_provenance["sourceSnapshot"]["decoder"] = DECODER_METADATA
    expected_provenance["sourceSnapshot"]["masterFiles"] = snapshot["files"]
    expected_provenance["stblTables"] = {
        m["table"]: {"sha256": m["sha256"], "entries": m["entries"]}
        for m in stbl_meta
    }
    artifacts.append((provenance_path, expected_provenance))

    if args.verify:
        mismatches = []
        for target, expected in artifacts:
            if not target.is_file():
                mismatches.append(f"missing committed artifact: {target}")
                continue
            actual = json.loads(target.read_text(encoding="utf-8"))
            if actual != expected:
                mismatches.append(f"committed artifact differs from extraction: {target}")
        if mismatches:
            raise ValidationError("\n".join(mismatches))
        print("verified    : committed raw Japanese artifacts are byte-source equivalent; no files written")
        return 0

    written: list[Path] = []
    for target, payload in artifacts[:-1]:
        write_atomic(target, payload)
        written.append(target)
    written.append(update_provenance(snapshot, stbl_meta, decrypted))

    print("written     :")
    for p in written:
        print(f"  {p.relative_to(REPO_ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ValidationError as exc:
        print(f"\nFAILED: {exc}", file=sys.stderr)
        print("No artifacts were written.", file=sys.stderr)
        sys.exit(1)
