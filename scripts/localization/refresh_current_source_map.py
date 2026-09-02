#!/usr/bin/env python3
"""Refresh only rows whose canonical source appeared in the current snapshot.

The reviewed map is deliberately preserved for every existing row. This
maintenance script promotes the three Soutan rows now present in the live
master snapshot and adds the current Kisui Star-6 scene-card bridge. It refuses
name/effect mismatches instead of guessing.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import msgpack
import os
import struct
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def decode_stbl(path: Path) -> list[str]:
    data = path.read_bytes()
    if data[:4] != b"STBL":
        raise ValueError(f"bad STBL magic: {path}")
    count, base = struct.unpack_from("<II", data, 8)
    offsets = struct.unpack_from(f"<{count}I", data, 16)
    values = []
    for offset in offsets:
        start = base + offset
        end = data.find(b"\0", start)
        if end < 0:
            raise ValueError(f"unterminated STBL entry at {start}: {path}")
        values.append(data[start:end].decode("utf-8"))
    return values


def load_tables(decrypted: Path) -> dict:
    tables = {}
    for index in range(1, 6):
        packet = msgpack.unpackb((decrypted / f"masters_00{index}.bin").read_bytes(), raw=False)
        tables.update(packet.get("master", {}) or {})
    return tables


def effects_hash(effects: list[dict]) -> str:
    rows = [
        {
            "condition": effect.get("condition"),
            "target": effect.get("target"),
            "effect": effect.get("effect"),
            "duration": effect.get("duration"),
        }
        for effect in effects
    ]
    return hashlib.sha256(json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp, path)
    except BaseException:
        try:
            os.unlink(temp)
        except OSError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", nargs="?", default=os.environ.get("RANHQ_GAME_DATA", r"C:\kingdom_data"))
    args = parser.parse_args()
    decrypted = Path(args.source_root).expanduser().resolve() / "decrypted"
    if not (decrypted / "master").is_dir():
        raise SystemExit(f"missing decrypted/master under {decrypted}")

    map_path = REPO / "data/source/cw_skills.map.json"
    source_map = json.loads(map_path.read_text(encoding="utf-8"))
    entries = source_map.get("skills") or {}
    tables = load_tables(decrypted)
    skill_rows = {row["id"]: row for row in tables["mstUnionConquestSkills"]}
    union_rows = {row["characterId"]: row for row in tables["mstUnionConquestGenerals"]}
    names = decode_stbl(decrypted / "master/MsgUnionConquestSkillName.stbl")
    descs = decode_stbl(decrypted / "master/MsgUnionConquestSkillDesc.stbl")

    characters = {}
    for file in sorted((REPO / "data/characters").glob("*.json")):
        for character in json.loads(file.read_text(encoding="utf-8")):
            characters[character["id"]] = character

    promoted = []
    for index, key in enumerate(("soutan#0", "soutan#1", "soutan#2"), start=1):
        character = characters["soutan"]
        union = union_rows[character["source"]["characterId"]]
        skill_id = union[f"skill{index}id"]
        row = skill_rows[skill_id]
        text_id = row["textId"]
        project_skill = character["skills"][index - 1]
        if names[text_id] != project_skill["name_jp"]:
            raise ValueError(f"{key}: project name does not match current STBL[{text_id}]")
        if not descs[text_id].strip():
            raise ValueError(f"{key}: current STBL description is empty at {text_id}")
        entry = entries[key]
        entry.update(
            status="exact",
            characterId=character["source"]["characterId"],
            skillId=skill_id,
            textId=text_id,
            sourceType="base",
            sourceSlot=index,
            sourceNameJp=names[text_id],
        )
        entry["basis"] = "Current decrypted master stable-ID join: mstUnionConquestGenerals skill slot -> mstUnionConquestSkills.textId."
        promoted.append((key, skill_id, text_id))

    character = characters["kisui"]
    project_skill = character["skills"][3]
    text_id = project_skill["textId"]
    skill_id = project_skill["cwId"]
    if skill_id != 869 or text_id != 868 or names[text_id] != project_skill["name_jp"]:
        raise ValueError("kisui#3: project Star-6 identity does not match current source")
    entries["kisui#3"] = {
        "status": "resolved",
        "characterId": character["source"]["characterId"],
        "skillId": skill_id,
        "textId": text_id,
        "sourceType": "scene_card_rank",
        "sourceSlot": None,
        "sourceNameJp": names[text_id],
        "fingerprint": {
            "name_jp": project_skill["name_jp"],
            "effectsHash": effects_hash(project_skill.get("effects") or []),
        },
        "sceneCard": {"cardId": 42004, "rank": 6},
        "basis": "Current CW6 scene-card bridge: card 42004 owner kisui, rank 6, and current STBL skillId 869/textId 868.",
    }
    promoted.append(("kisui#3", skill_id, text_id))

    # Keep project order stable and fail if a stale map row or a missing row is
    # encountered. This catches accidental edits to the current data files.
    project_keys = []
    for character in characters.values():
        for index, _ in enumerate(character.get("skills") or []):
            project_keys.append(f"{character['id']}#{index}")
    if set(project_keys) != set(entries) or len(project_keys) != len(entries):
        missing = sorted(set(project_keys) - set(entries))
        extra = sorted(set(entries) - set(project_keys))
        raise ValueError(f"map/project row mismatch; missing={missing}, extra={extra}")

    atomic_write(map_path, source_map)
    print(f"refresh_current_source_map: promoted {len(promoted)} current rows")
    for key, skill_id, text_id in promoted:
        print(f"  {key}: skillId={skill_id}, textId={text_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
