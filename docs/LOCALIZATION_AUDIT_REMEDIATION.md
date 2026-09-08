# September 2026 localization remediation

The finite Japanese audit covered 24 structured fallback occurrences. The
renderer now handles those compound conditions, counted targets and named
status recipients without changing original Japanese names or descriptions.
Known character operands resolve through the existing generated Japanese name
registry. Unknown named status recipients still return the complete source.

Reiou's CW6 source description explicitly names 呉鳳明 and 乱美迫; this supports
the existing structured `GHM` abbreviation used in the Japanese target renderer.
Ryofui's original description confirms the named recipients and 70% attack-seal
probability. Ranbihaku's description applies the highest-attack selector to both
the infantry and siege-weapon categories; a regression pins that shared scope.

Guide role metadata retains `owner_id` and `ownerNameJp` from the existing role
dataset. It does not import the full character graph. The corpus gate now merges
role skills by owner ID, matching the runtime merge and adding the 73 previously
omitted nonempty role fields. Japanese, Arabic and French all require zero
untouched fields. This gate proves renderer coverage, not native-speaker review
or the correctness of every pre-existing structured decomposition.

Shared character-name matching removes Arabic vowel marks and tatweel while
retaining Japanese distinctions and the established Romaji matching rules.
Authored concept aliases now include their grammatical forms in the same query
expansion, so French `infanterie`, `fantassin` and `fantassins` match the same
population. No fuzzy-search dependency or source data regeneration is involved.

Contrast changes are confined to the five audited surfaces: the Home guide
link, faction count, gallery/CW6 count, character faction label and Metawatch
source note. Browser tests composite actual foreground/background colors and
record font sizes and weights at 320, 390, 820 and 1440 pixels, including hover
and keyboard focus for interactive surfaces. Each pairing must reach 4.5:1.
