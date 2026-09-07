# Dependency maintenance — 7 September 2026

The F22 update stays on React Router 7 and Vite 8. The two direct dependencies
are pinned to the reviewed versions below; `npm ci` uses the complete lockfile.
No forced audit fix, overrides, framework migration or runtime server was added.

| Dependency | Previous resolution | Accepted resolution |
| --- | --- | --- |
| react-router / react-router-dom | 7.14.1 | 7.18.3 |
| vite | 8.0.13 | 8.0.16 |
| brace-expansion | 1.1.14 | 1.1.18 |
| js-yaml | 4.1.1 | 4.3.2 |
| nanoid | 3.3.12 | 3.3.18 |
| postcss | 8.5.14 | 8.5.28 |

Vite 8.0.16 is the patch containing the two reviewed Vite fixes. Router's
[7.15–7.18 changes](https://reactrouter.com/changelog) were reviewed for the
minor update: the app uses no unstable APIs, data-router actions or Framework
mode. URL normalization and route matching still receive browser regression
coverage; release notes alone do not prove compatibility.

## Advisory applicability

The initial audit reported **7 high-severity package entries**, representing
**20 distinct advisory records**. Router DOM inherits Router findings. These
counts do not demonstrate seven exploitable production vulnerabilities.
The final `npm audit --json` reports **zero advisories at every severity**;
there are no accepted residual advisory exceptions as of this review.

| Advisory | Actual input or architecture precondition before the update |
| --- | --- |
| [brace: repeated braces](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | Malicious expansion patterns; installed through the React ESLint plugin/minimatch. Lint inputs are repository controlled. |
| [brace: expansion length](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | Unbounded expansion output from crafted patterns in that same tooling path. |
| [brace: intermediate arrays](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | Crafted patterns bypass earlier allocation limits; covered by the final 1.1.18 patch. |
| [YAML: repeated aliases](https://github.com/advisories/GHSA-h67p-54hq-rp68) | Crafted YAML merge aliases; installed through ESLint configuration tooling, not a public YAML upload. |
| [YAML: merge chains](https://github.com/advisories/GHSA-52cp-r559-cp3m) | Crafted merge chains in the same repository-controlled configuration path. |
| [YAML: ordered maps](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | Crafted `!!omap` values; patched without changing configuration format. |
| [nanoid: negative size](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | Negative size to the non-secure generator. The installed PostCSS caller uses a fixed size of 6. |
| [nanoid: zero size](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | Zero-sized custom generator; no such caller was found in the inspected path. |
| [PostCSS: omitted source path](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | Attacker-controlled source-map comments with an unset `from` option. CSS inputs here are repository-controlled build inputs. |
| [PostCSS: source-map traversal](https://github.com/advisories/GHSA-r28c-9q8g-f849) | Malicious map paths in processed CSS, not a public runtime CSS processor. |
| [Router: stream error constructors](https://github.com/remix-run/react-router/security/advisories/GHSA-49rj-9fvp-4h2h) | Framework deserialization plus prior prototype pollution; maintainer excludes Declarative/Data mode. |
| [Router: manifest expansion](https://github.com/advisories/GHSA-8x6r-g9mw-2r78) | A Framework `__manifest` endpoint. RanHQ has no such endpoint. |
| [Router: document-request CSRF](https://github.com/remix-run/react-router/security/advisories/GHSA-84g9-w2xq-vcv6) | Framework actions handling mutation methods; maintainer excludes Declarative/Data mode. |
| [Router: mixed-slash navigation](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6) | Untrusted destination paths passed to navigation. Inspected callers use known routes and validated character IDs; no arbitrary destination input was found. |
| [Router: RSC redirect protocol](https://github.com/remix-run/react-router/security/advisories/GHSA-h8fp-f39c-q6mh) | Unstable RSC error handling, which RanHQ does not use. |
| [Router: hydration error constructors](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg) | Framework/Data error hydration or the corresponding custom hydration setup. The app uses Declarative BrowserRouter and build-only StaticRouter. |
| [Router: inefficient manifest matching](https://github.com/remix-run/react-router/security/advisories/GHSA-chx6-hx7r-mcp5) | Framework manifest routing; maintainer explicitly excludes Declarative/Data mode. |
| [Router: RSC CSRF bypass](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2) | Unstable RSC actions; absent here. The scanner's high classification differs from the maintainer's moderate label. |
| [Vite: Windows alternate paths](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff) | A network-exposed dev server, sensitive denied file and relevant Windows filesystem paths. Production serves static output. |
| [Vite: launch-editor UNC paths](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) | Running editor middleware on Windows plus a malicious request can disclose an NTLMv2 response. A malicious website can target loopback, so local-only binding is not a complete dismissal. Vite now bundles the fixed editor dependency. |

These are observed preconditions and caller analysis, not exploit tests or a
proof that every future input path is safe. Reassess if external content,
server rendering, Router actions or development-server exposure is introduced.

## Lockfile and runtime review

Only Router DOM, Vite and the Playwright acceptance runner changed in the root
dependency declarations. The lockfile changes 27 existing package records plus
the root record, adds `@playwright/test`, `playwright` and `playwright-core`, and
removes no records. Vite requires Rolldown 1.0.3 and matching optional platform
bindings, Oxc types 0.133.0 and tinyglobby 0.2.17. The optional Wasm runtime
resolves to 1.2.3 with wasm-util 0.10.3. These are test/build dependencies, not
new application services. Integrity/resolved fields were generated by npm.

Node **24.x** remains the documented and CI release runtime. Vite's declared
minimum is 20.19 or 22.12; the optional Wasm fallback now requires 22.13 in the
Node 22 line. Do not treat the minimum Vite engine range as a tested
cross-platform release matrix. `npm ls --all` completes without dependency
or peer errors.

The maintenance commands used were targeted installs of Router DOM 7.18.3 and
Vite 8.0.16 followed by `npm update brace-expansion js-yaml nanoid postcss`.
Fresh release verification must use `npm ci`, not repeat those update commands.

## Evidence

Local evidence is retained in
`C:/Users/Admin/.codex/ranhq-work/2026-09-05/`:
`f22-before-audit.json`, `f22-after-audit.json`, `f22-lock-diff.json`,
the dependency trees, release logs and HTML comparison.
The update retains identical root content in all 1,150 generated HTML files;
bundle filenames are expected to change. The normal release gate verifies
metadata, canonicals, alternates, source artifacts, calculations and browser
behavior separately. See the work log for terminal acceptance results.

Both the working tree and a separate 949-file application snapshot with a fresh
dependency install passed `check:release`: 478 tests in 35 files, lint, source
and catalog checks, 1,149 prerendered routes plus the 404 artifact, SEO validation,
and all 40 portable browser cases. The clean copy excludes local agent settings
and credentials. An additional 36 French route/viewport checks and eight
EN/JA/AR/FR phone/desktop dialog flows, including real canvas image previews,
passed without runtime errors. All 36 French screenshot pairs retain their
dimensions; 19 are pixel-identical. Visual review found no content or layout change in the remaining pairs;
animated tier highlights and small rasterization differences are retained in
the comparison evidence.

No remote CI run or deployment is claimed. Historical raw-source
re-extraction remains subject to [the source prerequisite](SOURCE_SNAPSHOT.md).
