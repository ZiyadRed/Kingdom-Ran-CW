"""Read-only verification of the October 5 buff corrections against the game dump.

Maintainer check, not a build dependency. Run with an optional kingdom_data root.
No files are written. The evidence includes the original STBL text and snapshot
hashes; assignments and values are checked independently against all five masters.
"""

from pathlib import Path
import argparse
import hashlib
import json
import struct
import sys
from datetime import datetime

import msgpack


REPO = Path(__file__).resolve().parents[1]
UNITS = {"Infantry": 0, "Cavalry": 1, "Archer": 2, "Shield": 3}
COUNTRIES = {"Qin": 1, "Zhao": 2, "Wei": 3, "Chu": 4, "Han": 5}
BELONGS = {"Hishin Unit": 8, "Ousen Army": 25, "Qiang Tribe": 16}
FIELD_STATS = {"HP": 21, "Attack": 22, "Defense": 23}
CW_STATS = {"HP": 131, "Attack": 129, "Defense": 130}
REVIEW_TIME = int(datetime.fromisoformat("2026-10-05T23:59:59+09:00").timestamp())


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


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
    args = parser.parse_args()
    root = Path(args.source_root) / "decrypted"
    proof = read_json(REPO / "data/source/buff_corrections_2026-10-05.json")
    tables = {}
    manifest = ""
    for name, expected in proof["sourceSnapshot"]["masterFiles"].items():
        data = (root / name).read_bytes()
        digest = hashlib.sha256(data).hexdigest().upper()
        assert digest == expected, f"Snapshot changed: {name}"
        manifest += f"{name}:{digest}\n"
        tables.update(msgpack.unpackb(data, raw=False)["master"])
    assert hashlib.sha256(manifest.encode()).hexdigest().upper() == proof["sourceSnapshot"]["manifestSha256"]
    strings = {}
    for name, expected in proof["stblSha256"].items():
        path = root / "master" / name
        assert hashlib.sha256(path.read_bytes()).hexdigest().upper() == expected, name
        strings[name.removesuffix(".stbl")] = stbl(path)
    assert strings["MsgMstBelong"][BELONGS["Qiang Tribe"]] == "羌族"
    maps = {name: {row["id"]: row for row in rows} for name, rows in tables.items() if rows and "id" in rows[0]}
    chars = {}
    for path in (REPO / "data/characters").glob("*.json"):
        chars.update({row["id"]: row for row in read_json(path)})
    units = read_json(REPO / "data/cw_buffs.json")
    teams = read_json(REPO / "data/cw_team_buffs.json")
    cw_generals = {row["characterId"]: row for row in tables["mstUnionConquestGenerals"]}
    for record in proof["corrections"]:
        char = chars[record["character_id"]]
        cid = record["characterId"]
        assert char["source"]["characterId"] == cid
        groups = units if record["kind"] == "unit" else teams["states" if record["kind"] == "state" else "armies"]
        matches = [row for row in groups[record["category"]][record["stat"]] if row["ownership_id"] == record["ownership_id"]]
        assert len(matches) == 1, record
        entry = matches[0]
        assert entry["character_id"] == char["id"]
        assert entry["value"] == record["value"]
        if record["method"] == "cw":
            general = cw_generals[cid]
            assert general[f"skill{record['slot']}id"] == record["skillId"]
            skill = maps["mstUnionConquestSkills"][record["skillId"]]
            assert skill["skillType"] == 4
            assert skill["textId"] == record["textId"]
            assert str(record["effectId"]) in skill["skillEffectIds"].split(",")
            effect = maps["mstUnionConquestSkillEffects"][record["effectId"]]
            assert effect["effectType"] == CW_STATS[record["stat"]]
            assert effect["targetType"] == 19 and effect["targetParam"] == UNITS[record["category"]]
            assert effect["effectValue1"] / 100 == record["value"]
            name = strings["MsgUnionConquestSkillName"][skill["textId"]]
            desc = strings["MsgUnionConquestSkillDesc"][skill["textId"]]
        else:
            assert entry["skill_layer"] == record["method"]
            general = maps["mstUnitGenerals"][record["generalId"]]
            assert general["characterId"] == cid and general["publicTime"] <= REVIEW_TIME
            if record["method"] == "normal":
                binding = maps["mstUnitGeneralAbilities"][record["generalId"]]
                assert binding[f"ability{record['slot']}Id"] == record["skillId"]
                skill = maps["mstUnitAbilities"][record["skillId"]]
                name_id = desc_id = skill["id"]
                stem = "MsgUnitAbility"
            else:
                assert record["method"] == "ura"
                binding = maps["mstUnitSecondSkillGenerals"][record["bindingId"]]
                assert binding["generalId"] == general["id"] and binding["publicTime"] <= REVIEW_TIME
                assert binding[f"skill{record['slot']}Id"] == record["skillId"]
                skill = maps["mstUnitSecondSkills"][record["skillId"]]
                name_id, desc_id = skill["nameId"], skill["captionId"]
                stem = "MsgUnitSecondSkill"
            assert skill["typeId"] == 4 and skill["typeSubId"] == record["fieldAbilityId"]
            field = maps["mstUnitBattleFieldAbilities"][record["fieldAbilityId"]]
            assert field["targetType"] == FIELD_STATS[record["stat"]]
            if record["kind"] == "unit":
                assert field["attributeType"] == UNITS[record["category"]]
                assert field["countryId"] == 0 and field["belongId"] == 0
            elif record["kind"] == "state":
                assert field["countryId"] == COUNTRIES[record["category"]] and field["belongId"] == 0
            else:
                assert field["belongId"] == BELONGS[record["category"]] and field["countryId"] == 0
            # These fixed-point all-army rates are percent * 10000, at skill Lv99.
            assert record["level"] == 99 and field["effectLvB"] / 10000 == record["value"]
            assert (name_id, desc_id) == (record["nameId"], record["captionId"])
            name, desc = strings[stem + "Name"][name_id], strings[stem + "Desc"][desc_id]
        assert name == record["nameJp"] and desc == record["descriptionJp"]
        assert "同盟争覇戦" in desc
    # Existing Duke Sei normal copy: label it without changing its ownership.
    duke_normal = next(row for row in teams["states"]["Zhao"]["Defense"] if row["ownership_id"] == "buff_74ca97f19a8f46b0830fc7e94d17df16")
    assert duke_normal["skill_layer"] == "normal" and duke_normal["value"] == 5
    assert maps["mstUnitGenerals"][409]["characterId"] == 221
    assert maps["mstUnitGeneralAbilities"][409]["ability3Id"] == 1356
    assert maps["mstUnitAbilities"][1356]["typeSubId"] == 84
    assert maps["mstUnitBattleFieldAbilities"][84]["countryId"] == 2
    assert maps["mstUnitBattleFieldAbilities"][84]["effectLvB"] / 10000 == duke_normal["value"]
    print(f"Verified {len(proof['corrections'])} corrections: assigned source IDs, original Japanese, values and targets; snapshot {proof['sourceSnapshot']['snapshotLabel']}.")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
