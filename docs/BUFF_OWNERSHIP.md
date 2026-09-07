# Buff ownership identity

Every selectable unit, state, army, siege and terrain buff source has a checked-in
`ownership_id` of the form `buff_` plus 32 lowercase hexadecimal UUID characters.
This is RanHQ-authored persistence metadata, separate from the game's IDs and
`source_id` references. Changing a name, translation, percentage, cost, category,
sort order or source reference must retain the same ownership ID.

For a genuinely new selectable source, allocate one UUID once, remove its hyphens,
prefix it with `buff_`, and save it with the row. Do not regenerate IDs in an
extraction script. When regenerating source payloads, carry these IDs forward using
an evidenced source relationship; leave an ambiguous join unassigned for review.
The source-data tests still compare gameplay fields against the character data.
The ownership tests reject missing, malformed and duplicate IDs.

A combined shard/red-crystal source uses the authored base ID for red crystals
and `<ownership_id>:shard` for its independent shard flag. A source without an
independent shard control must not acquire such an alias.

## Frozen legacy mapping

`data/buff_ownership_legacy.json` is an explicit, versioned migration manifest.
Each exact historical key maps to its authored destination ID. Keep these keys
frozen when editing current display or gameplay content. Historical numeric array
suffixes are removed only when the resulting key exists in this manifest; a
`:shard` suffix is preserved and requires its own explicit alias.

The manifest retains the evidenced Hoki-to-Fuuki siege name correction and the
old Nakon 10% source split into two independent 5% sources. The two Kyoubou sources
remain distinct. Multiple aliases for one source merge with `true` winning over
`false`, independently of input order. An intentional one-to-many migration needs
source evidence and a regression case. Unknown or explicitly ambiguous mappings
remain opaque keys and round-trip unchanged; no name or value matching is used.

Migration is pure and idempotent. Loading existing `ranhq-progress-v3` data does
not write local storage. An explicit edit saves normalized IDs. Export uses the
existing version-1 four-bucket backup contract. Import validates the complete
payload before normalization or writes and retains the exact prior raw snapshot
under `ranhq-progress-v3:before-import`. Restoring that snapshot applies the same
known migration, preserving its ownership, unknown keys and other buckets.

Do not remove frozen aliases when removing a displayed source. Old backups must
remain recoverable. If a source is intentionally split or merged in the future,
document the evidence and test both independent saved flags and rollback before
changing the manifest.

Validation: `npm test -- src/buff-ownership.test.jsx src/progress-storage.test.js
src/core.test.js src/siege-buffs.test.js src/redesign-contracts.test.js`, followed
by the normal release gates and a browser ownership/import/rollback check.
