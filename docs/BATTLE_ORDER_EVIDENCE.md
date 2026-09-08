# Battle Order formation and skill ordering (F06)

Verified 2026-09-08. The existing `simulate()` sequencing is retained. The
contradiction was in Builder/Battle Order copy: **formation order advances from
the first member; combat skill slots within each general run highest-first**.
All four locale catalogs now distinguish these two orders.

## Primary game evidence

The [official Kingdom Ran Castle War FAQ](https://www.kingdomran.jp/help/doumeisouhasen)
was checked live on 2026-09-08. Its **戦闘ルールが知りたい** section, under
**戦闘はどの順で行動するの？**, explicitly lists this four-member example:

| Action | Side | Formation member |
| --- | --- | --- |
| 1 | Attacking | 1 |
| 2 | Defending | 1 |
| 3 | Attacking | 2 |
| 4 | Defending | 2 |
| 5 | Attacking | 3 |
| 6 | Defending | 3 |
| 7 | Attacking | 4 |
| 8 | Defending | 4 |

The same section includes a four-attacker/two-defender example: A1, D1, A2,
D2, A3, A4. It explains attacker-first alternation and consecutive actions when
one side has fewer generals. Weapons act after their corresponding general.

The separate FAQ **戦技スキルを複数持っている武将は、どの順で戦技を発動するか**
specifies skill 3, then 2, then 1. This is a per-general skill rule, not a
reverse formation rule. Its role-skill section also confirms turn-one activation
separately from general attacks.

The web text extractor omitted these older FAQ sections from its page view;
a direct HTTP read of the complete official HTML verified both sections.
The independently stored local FAQ text at `C:/kingdom_data/faq_pages/cw.txt`
contains the formation examples at lines 698–777 and skill ordering at
lines 1156–1157. No source text was modified.

## Local investigation and provenance limits

- Read the relevant tables from `C:/kingdom_data/decrypted/masters_001.bin`
  through `masters_005.bin` using MessagePack. `mstUnionConquestGenerals`
  has explicit skill-ID slots; `mstUnionConquestSkills` records type, timing,
  trigger and effect IDs. These tables were not used to infer formation order.
- Inspected the local `MsgUnionConquestSkillDesc.stbl` resource and the native
  `C:/kingdom_data/kingdom_extracted/lib/arm64-v8a/libokp.so` symbol inventory.
  Symbol names alone do not prove action scheduling. No native scheduling
  implementation was reconstructed or claimed verified.
- `NOTES_FOR_CLAUDE.md` lines 53–81 records forward formation ordering and
  reverse per-general skills, with an older screenshot-based claim. The original
  screenshots were not recovered in this bounded pass. The independently checked
  official FAQ, rather than that note or RanHQ's existing code, is authoritative.
- Current local masters were inspected read-only. They were not substituted for
  the missing historical provenance snapshot, and no provenance hashes changed.

## Regression and scope

`src/core.test.js` covers five generals in explicit four-slot attacking and
defending formations, including leading/interior/trailing empty slots, multiple
combat skills per general, an intervening Strategy skill, all four turns,
attacker/defender interleaving, and fallback to Normal Attack. Empty slots are
removed before `simulate()`, matching its page caller; original member ordering
is preserved. Empty-slot compaction is an implementation regression, not a claim
that the FAQ separately specifies every possible sparse UI formation.

A second case uses the actual Ousen/Moubu/Renpa/Ouki attacking roster and Kyou
in a sparse defending formation. It retains the audited order
Ousen, Kyou, Moubu, Renpa, Ouki.

The formation rule is established; there is no remaining F06 formation-order
evidence gap. This work does not certify the existing planner as a full battle
simulation: morale, casualties, weapons and conditional skill execution remain
outside this sequencing check. It does not change formation direction in Arabic.

Focused acceptance: `npm.cmd test -- src/core.test.js src/i18n/i18n.test.js`
passed 42 tests in 2 files on 2026-09-08.
