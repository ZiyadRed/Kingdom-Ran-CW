# Archive query and return context

The character collection stores its text query in `q` and its selected faction
in `faction`. Text continues to search the entire roster; selecting a faction
clears text and returns to accepted-banner browsing. Character links and the
detail close/breadcrumb links carry the return context. Typing replaces the
current history entry; faction choices and detail navigation create entries.

Faction values must be authored faction IDs. Duplicate fields, invalid faction
IDs, malformed text, control characters and queries longer than 200 characters
fall back safely. Query strings do not change canonical SEO URLs.

Static HTML and the first hydration render use the route's default faction and
empty text. URL state is applied in a transition after hydration. A direct
character URL without parameters defaults to that character's actual faction.

The optional `ranhq:archive-return-v1` session-storage bookmark remembers the
last validated context within this browser tab. It is consulted only when a
fresh collection entry has no query string, then copied into the URL with
history replacement. Explicit URL state and browser history take precedence.
Storage failure leaves URL persistence functional. Invalid detail routes never
restore or write this bookmark. This does not add a global application store.

Regression coverage lives in `archive-url-state.test.js` and the browser
`archive-state.spec.js`, alongside the mobile detail and full release suites.
