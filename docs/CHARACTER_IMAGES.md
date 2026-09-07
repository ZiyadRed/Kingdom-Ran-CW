# Character icon recovery

The shared `CharIcon` in `src/core.jsx` tries the record's original icon, then
its existing banner thumbnail, then a visible initial. Duplicate URLs are tried
only once. It never fabricates artwork, writes storage or retries in a loop.

Recovery state belongs to the character and its source URLs. Changing either
starts a fresh chain; changing translated display text, dimensions or unrelated
page state does not. Both request errors and images that already failed before
hydration are handled. Each candidate has a separate image element so a delayed
error from the previous element cannot fail the next candidate.

Healthy server markup and loading priority remain unchanged. The fallback keeps
the original class, dimensions and round/square shape, including the constrained
50×64px phone detail portrait. Its full localized name is exposed through
`role="img"` and `aria-label`. A faction tint over opaque parchment with navy
text keeps initials readable on both dark headers and light picker cards.

Tests include server-source choice, source-less accessible markup, actual failed
requests before hydration, exactly one icon/thumbnail attempt, terminal initials,
character changes/remount, round Builder icons, saved-state preservation, and
rendered text contrast. The four-locale browser matrix compares healthy, failed
icon and failed icon-plus-thumbnail states on phone and desktop. No original
asset or character record is changed.
