"""Read-only verification of the October 14 LG artwork and CW buff update.

Run with an optional kingdom_data root. Requires the pinned October 14 snapshot;
not a CI dependency. --official-art checks decoded official PNGs pixel-for-pixel.
"""

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import struct
import sys

import msgpack
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
CW_STATS = {"HP": 21, "Attack": 22, "Defense": 23}
REVIEW_TIME = int(datetime.fromisoformat("2026-10-14T18:00:00+09:00").timestamp())


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def stbl(path):
    data = path.read_bytes()
    assert data[:4] == b"STBL", path
    count, base = struct.unpack_from("<II", data, 8)
    values = []
    for index in range(count):
        start = base + struct.unpack_from("<I", data, 16 + index * 4)[0]
        end = data.find(b"\0", start)
        assert end >= start, (path, index)
        values.append(data[start:end].decode("utf-8"))
    return values


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_root", nargs="?", default=r"C:\kingdom_data")
    parser.add_argument("--official-art", type=Path)
    args = parser.parse_args()
    root = Path(args.source_root) / "decrypted"
    proof = read_json(REPO / "data/source/moubu_officers_2026-10-14.json")
    tables, manifest = {}, ""
    for name, expected in proof["sourceSnapshot"]["masterFiles"].items():
        data = (root / name).read_bytes()
        actual = hashlib.sha256(data).hexdigest().upper()
        assert actual == expected, f"Snapshot changed: {name}"
        manifest += f"{name}:{actual}\n"
        tables.update(msgpack.unpackb(data, raw=False)["master"])
    assert hashlib.sha256(manifest.encode()).hexdigest().upper() == proof["sourceSnapshot"]["manifestSha256"]
    strings = {}
    for name, expected in proof["stblSha256"].items():
        path = root / "master" / name
        assert digest(path) == expected, name
        strings[name.removesuffix(".stbl")] = stbl(path)
    assert strings["MsgMstBelong"][27] == "蒙武軍"
    maps = {name: {r["id"]: r for r in rows} for name, rows in tables.items() if rows and "id" in rows[0]}
    chars = {}
    for path in (REPO / "data/characters").glob("*.json"):
        chars.update({r["id"]: r for r in read_json(path)})
    units = read_json(REPO / "data/cw_buffs.json")
    teams = read_json(REPO / "data/cw_team_buffs.json")
    legacy = set(target for targets in read_json(REPO / "data/buff_ownership_legacy.json")["legacyKeys"].values() for target in targets)
    expected_sources = set()
    for character in proof["characters"]:
        cid, slug = character["characterId"], character["character_id"]
        char = chars[slug]
        lg = maps["mstUnitGenerals"][character["lgGeneralId"]]
        assert lg["characterId"] == cid == char["source"]["characterId"]
        assert lg["id"] in char["source"]["generalIds"]
        assert lg["publicTime"] == character["lgPublicTime"] <= REVIEW_TIME and lg["rarityId"] == 5
        assert maps["mstUnitGeneralAbilities"][lg["id"]]["lgAbilityId"] == character["lgAbilityId"]
        assert maps["mstUnitGeneralUpgradeSeconds"][character["lgUpgrade"]["id"]] == character["lgUpgrade"]
        asset = maps["mstAssetGenerals"][lg["assetId"]]
        for key, value in character["asset"].items():
            assert asset[key] == value
        assert strings["MsgUnitGeneralName"][lg["id"]] == char["name_jp"] == character["nameJp"]
        assert strings["MsgUnitGeneralRubyName"][lg["id"]] == character["rubyJp"]
        assert char["rarity"] == character["initialRarity"]  # Initial rarity controls CW stone costs.
        cw = next(r for r in tables["mstUnionConquestGenerals"] if r["characterId"] == cid)
        for skill in character["cwSkills"]:
            assert cw[f"skill{skill['slot']}id"] == skill["skillId"]
            actual = maps["mstUnionConquestSkills"][skill["skillId"]]
            assert actual["textId"] == skill["textId"]
            assert strings["MsgUnionConquestSkillName"][actual["textId"]] == char["skills"][skill["slot"] - 1]["name_jp"] == skill["nameJp"]
        # Audit all assigned Ura slots, including the excluded battlefield modes.
        for binding in tables["mstUnitSecondSkillGenerals"]:
            if binding["generalId"] not in char["source"]["generalIds"]:
                continue
            for slot in range(1, 7):
                skill = maps["mstUnitSecondSkills"].get(binding[f"skill{slot}Id"])
                if not skill or skill["typeId"] != 4:
                    continue
                field = maps["mstUnitBattleFieldAbilities"][skill["typeSubId"]]
                if field["targetType"] in CW_STATS.values():
                    expected_sources.add((cid, skill["id"], field["id"]))
    assert expected_sources == {(r["characterId"], r["skillId"], r["fieldAbilityId"]) for r in proof["corrections"]}
    for record in proof["corrections"] + proof["existingNormal"]:
        source = units if record["kind"] == "unit" else teams["armies"]
        matches = [r for r in source[record["category"]][record["stat"]] if r["ownership_id"] == record["ownership_id"]]
        assert len(matches) == 1, record
        entry = matches[0]
        assert entry["character_id"] == record["character_id"]
        assert entry["value"] == record["value"] and entry["skill_layer"] == record["method"]
        general = maps["mstUnitGenerals"][record["generalId"]]
        assert general["characterId"] == record["characterId"] and general["publicTime"] <= REVIEW_TIME
        if record["method"] == "ura":
            assert record["ownership_id"] not in legacy
            binding = maps["mstUnitSecondSkillGenerals"][record["bindingId"]]
            assert binding["generalId"] == general["id"] and binding[f"skill{record['slot']}Id"] == record["skillId"]
            assert binding["publicTime"] == record["publicTime"] <= REVIEW_TIME
            skill = maps["mstUnitSecondSkills"][record["skillId"]]
            name_id, desc_id, stem = skill["nameId"], skill["captionId"], "MsgUnitSecondSkill"
        else:
            binding = maps["mstUnitGeneralAbilities"][record["generalId"]]
            assert binding[f"ability{record['slot']}Id"] == record["skillId"]
            skill = maps["mstUnitAbilities"][record["skillId"]]
            name_id = desc_id = skill["id"]
            stem = "MsgUnitAbility"
        assert skill["typeId"] == 4 and skill["typeSubId"] == record["fieldAbilityId"]
        field = maps["mstUnitBattleFieldAbilities"][record["fieldAbilityId"]]
        assert field["targetType"] == CW_STATS[record["stat"]] and field["countryId"] == 0
        assert field["attributeType"] == (0 if record["kind"] == "unit" else -1)
        assert field["belongId"] == (0 if record["kind"] == "unit" else 27)
        assert record["level"] == 99 and field["effectLvB"] / 10000 == entry["value"]
        assert (name_id, desc_id) == (record["nameId"], record["captionId"])
        assert strings[stem + "Name"][name_id] == record["nameJp"]
        assert strings[stem + "Desc"][desc_id] == record["descriptionJp"]
        assert "同盟争覇戦" in record["descriptionJp"]
    assert teams["armies"]["Moubo Army"]["HP"] == []
    for record in proof["excludedNonCw"]:
        skill = maps["mstUnitSecondSkills"][record["skillId"]]
        field = maps["mstUnitBattleFieldAbilities"][record["fieldAbilityId"]]
        assert skill["typeSubId"] == field["id"] and field["targetType"] == record["targetType"]
        assert field["targetType"] not in CW_STATS.values()
    for artwork in proof["artwork"]:
        output = REPO / artwork["output"]
        assert digest(output) == artwork["outputSha256"]
        decoded = Image.open(output).convert("RGBA")
        assert list(decoded.size) == artwork["size"]
        source = Path(artwork["sourcePath"]) if artwork["sourcePath"] else None
        if artwork["sourceUrl"] and args.official_art:
            source = args.official_art / f"{artwork['character_id']}-LG.png"
        if source:
            assert digest(source) == artwork["sourceSha256"]
            assert Image.open(source).convert("RGBA").tobytes() == decoded.tobytes()
    print(f"Verified all {len(proof['corrections'])} new CW buffs, retained normal ownership, LG joins, unchanged CW assignments, mode exclusions and {len(proof['artwork'])} artwork files.")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
