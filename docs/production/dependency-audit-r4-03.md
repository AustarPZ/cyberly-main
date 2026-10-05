# R4-03 dependency audit and risk classification

Audit date: 2026-10-05 (Asia/Kuala_Lumpur). **R4-03 dependency characterization was independently reviewed and accepted by Control Tower on 2026-10-05.** Acceptance validates the audit characterization and risk classification; it does not permanently accept dependency risk, authorize upgrades, or certify staging/public runtime, AI providers or production. HEAD: `0368dbece8d587496e0c106da6be2e39b0c928ba`; branch: `ui-v2-account-center-r1`; repository: `C:/Users/AsusT/Documents/Codex/cyberly-main-ui-v2-account-center-r1`; origin: <https://github.com/AustarPZ/cyberly-main>.

Fresh remote authority: develop = HEAD; master = `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`. Canonical annotated recovery tag `r3-staging-accepted-2026-10-03` peels to that baseline; remote tag object `9b27ccde8dac80f0ab1b0e66db269b37cf79deef`. The branch difference is intentional. R4-01/R4-02 are closed by Owner authority; this audit does not reopen R3 or authorize upgrades, deployment or production activity.

## Toolchain, package roots and installed health

Local Node **v24.13.0**, npm **11.6.2**; npm governs three independent package-lock v3 files. No workspace declaration, shrinkwrap, Yarn/pnpm lock, .nvmrc, .node-version, .tool-versions, Dockerfile, Render runtime config or GitHub workflow was found in the repository inventory. No root package engines/packageManager declaration. Root scripts delegate frontend build/start to client, backend start and DB commands to server; `concurrently` is local development orchestration only.

| Root | Name/version | Private | Lockfile | Direct dependencies | Direct devDependencies | Locked package entries excluding root | Installed tree |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| root | cyber-site 0.1.0 | true | package-lock.json | 0 | 1 | 20 | node_modules absent; concurrently missing; depth0/all exit 1 |
| client | cyber-site 0.1.0 | true | client/package-lock.json | 12 | 0 | 1415 | depth0 PASS; all exit 1: invalid yaml optional peer |
| server | server 1.0.0 | not declared | server/package-lock.json | 10 | 0 | 130 | depth0/all PASS |

Client invalid peer: `react-scripts > tailwindcss > postcss-load-config@6.0.1` requires optional `yaml ^2.4.2`, but resolves to `yaml@1.10.3`. The lockfile records this same combination; this is not evidence of an audit-induced mutation. No additional missing/invalid/extraneous errors are reported for client or server. Repeated deduped references are ordinary hoisting, not separately proven dedupe defects. Root installed-tree completeness cannot be assessed because node_modules is absent; no install was attempted.

All locked dependency Node engine ranges that were declared accept 24.13.0 (checked with installed semver). Core floors: concurrently >=22, Google GenAI >=20, bcrypt/Express/Helmet >=18, mysql2 >=8, dotenv >=12, nodemailer >=6; some packages such as OpenAI have no lockfile Node engine field. This proves declared-range compatibility, not complete native-addon or provider-runtime certification. Deployed Render Node versions were not queried.

[Node release schedule](https://github.com/nodejs/Release#release-schedule) identifies Node 24 as Active LTS on this audit date; the latest observed 24.x during this audit was v24.21.0 (2026-09-07), from the [official release index](https://nodejs.org/dist/index.json). Local Node remains v24.13.0 and declared package engine ranges accept it; local compatibility does not certify staging runtime. Actual Render runtime version remains unverified in R4-03. Runtime pin / authority review and supported-line patch review belong to subsequent corrective work before new live-runtime certification. No claim that 24.13.0 contains all current runtime security fixes is made; no local Node version change is authorized here.

## Security audit summary

Counts are npm vulnerability **package entries**, including propagated metavulnerabilities; they are not unique CVEs or proven exploits. Scope below separates manifest classification from actual runtime use.

| Root | Full critical/high/moderate/low/total | Omit-dev critical/high/moderate/low/total |
| --- | --- | --- |
| root | 0/2/0/0/2 | 0/0/0/0/0 |
| client | 1/69/9/4/83 | 1/69/9/4/83 |
| server | 0/1/2/0/3 | 0/1/2/0/3 |

Client puts CRA and testing libraries in dependencies, so omit-dev retains the entire graph. This does not establish that CRA/Jest vulnerabilities ship into browser execution. Accepted deployment uses static React output and a separate Express API (see [Current Deployment](deployment/current-deployment.md)); no source use of CRA dev server, Jest, SVGO or PostCSS in the Express runtime was found. Build/test tools still pose risks when processing untrusted source/config or exposing a development server.

## Materiality and special R4 questions

**A. Production-reachable High/Critical?** No Critical was found in the server graph. High `nodemailer@9.0.3` is a direct server dependency used by `server/src/email/mailTransport.js:82-90`: createTransport/sendMail receive recipient strings from registration verification, password reset, email change and guardian flows. Classification: **PRODUCTION_REACHABLE at the SMTP code-path level, conditional on SMTP enabled**. This is not dismissal based on passing tests. Deployed SMTP mode and package bytes were not independently inspected.

High [GHSA-2x7j-588g-ccc2](https://github.com/advisories/GHSA-2x7j-588g-ccc2) affects <9.1.0 and is fixed in 9.1.0. High [GHSA-v53p-9fqp-m79j](https://github.com/advisories/GHSA-v53p-9fqp-m79j) affects <=10.0.5 and is fixed in 10.0.6. Both involve address parsing DoS. Repository validation uses a single-email regex (auth/validation.js:5-6), guardian validation additionally caps 254 characters; persisted email columns cap 254/255 characters (migrations 001/027/030/032), requests have a 32kb JSON cap (server.js:227), and auth has rate controls. These restrict the advisory examples, but auth validation itself has no universal explicit address-length/structured-address policy. No adversarial route-to-parser reproduction was run and no deployment behavior was assumed. **A material release-blocking exploit is not established in this audit**; bounded reachability follow-up and remediation/explicit risk acceptance are prioritized before new public/live-runtime certification. No Class E is declared.

Maintenance authority checked on 2026-10-05: [Nodemailer upstream security policy](https://github.com/nodemailer/nodemailer/security/policy) supports **10.x only**, with no security-fix backports to **<10.0**. Therefore `nodemailer@9.0.3` is on an **unsupported upstream security major**, not merely an outdated direct dependency. This strengthens its R4 production-path priority; it does not establish active exploitation in Cyberly. Preserve the SMTP-conditional PRODUCTION_REACHABLE classification and bounded exploitability uncertainty above.

Other Nodemailer advisories concern legacy resolveContent/file/URL access, recipient-domain policy, nested recipient arrays and cross-transport DNS/TLS reuse. Current mailTransport constructs fixed fields (from/to/subject/text/html), does not expose attachment paths, resolveContent or user-supplied SMTP transport configuration. Those specific preconditions are not demonstrated; keep them in the advisory register rather than certifying their absence from every future path. A 9.1.1-only upgrade leaves later advisories unresolved. **10.0.6 is a known minimum fix point for one relevant High advisory, not a durable remediation target**; 10.0.14 was the registry latest observed during the audit, not a fixed future recommendation. **R4-03A_DEPENDENCY_SECURITY_CORRECTIVE** is required before R4 is considered complete, but is not started or authorized for implementation by this persistence task. At execution time R4-03A must perform a fresh advisory / registry check and select a currently supported Nodemailer 10.x candidate that clears the relevant known advisories and passes Cyberly compatibility tests. The candidate must be >= all applicable patched versions and should normally be a current supported 10.x maintenance release rather than an obsolete minimum patch. No package or version change is authorized in R4-03 persistence.

Client Critical [GHSA-xv26-6w52-cph6 / CVE-2026-54466](https://github.com/advisories/GHSA-xv26-6w52-cph6): `react-scripts@5.0.1 > webpack-dev-server@4.15.2 > sockjs@0.3.24 > faye-websocket@0.11.4 > websocket-driver@0.7.4`; affected <0.7.5, fixed 0.7.5. Also reachable through jsdom's WebSocket dependency during tests. **DEV_TOOLING_ONLY / TEST_ONLY**, not the recorded static staging deployment. Avoid exposing the dev server or feeding untrusted protocol traffic; patch candidate is a tooling maintenance item, not a live production Critical declaration.

**B. Node compatibility?** Declared locked engine ranges accept local Node 24.13.0; unknown deployed runtime and native/provider behavior remain limitations. Review Node 24 patch currency and establish runtime authority before R5 certification.

**C. CRA immediate blocker or debt?** [React deprecated Create React App for new apps](https://react.dev/blog/2025/02/14/sunsetting-create-react-app). CRA 5.0.1 is architectural maintenance debt with substantial vulnerable tooling, not evidence of an immediate static-site runtime blocker. Do not migrate frameworks automatically in R4. npm's suggested `react-scripts 0.0.0` is not an acceptable remediation plan.

**D. Direct abandoned/deprecated?** None of the 23 declared direct packages returned a registry deprecated field. CRA's lifecycle warning is separate from the react-scripts registry flag; 25 client lock entries and one server transitive are deprecated (list below). Abandonment of every package is not independently certified.

**E. R5_BLOCKED = NO** means R4-03 found no dependency Class E issue inherently preventing R5 planning, provider adapter characterization, unit/mocked provider work or bounded implementation preparation. This classification is not execution authorization for R5 and does not authorize live provider calls, staging live-runtime certification, public runtime certification or production release. R5 live-call authorization remains a separate Owner / Control Tower Gate.

**F. Before a new live/public runtime certification Gate**, R4 must explicitly resolve or govern (1) Nodemailer production-path security status, (2) actual operational Node runtime authority, and (3) other specifically authorized compatible runtime dependency remediations. Nodemailer work must follow the R4-03A execution-time advisory / registry policy above. mysql2/qs and SDK changes require their own scoped authorization and compatibility verification; latest availability is not upgrade authorization.

**G. Defer:** CRA/test-runner migration, i18next/react-i18next majors, web-vitals major and optional tooling redesign to R8 or Post-Capstone with explicit approval. Defer optional React/library feature upgrades until an actual requirement exists. Do not defer a subsequently demonstrated material production exploit solely to preserve this order.

### Other server findings

- `mysql2@3.22.5` Moderate, direct, `mysql2/promise` used by database/pool.js:1. GHSA-rgwj-5xj2-c3m3: compressed-protocol inflate; vulnerable <=3.23.0. No compression flag is enabled in repository pool configuration; no live DB handshake inspected. PRODUCTION_REACHABLE library, specific compression precondition not demonstrated; compatible 3.24.5 candidate, Class B database/TLS regression scope.
- `qs` Moderate, transitive through Express/body-parser. GHSA-x5fp-wj9c-mxmx and GHSA-4mjr-xmp4-gh2g. API uses express.json, not express.urlencoded or an explicit extended query parser; default Express5 query behavior must remain accounted for. PRODUCTION_TRANSITIVE_UNCLEAR for vulnerable functions; compatible transitive fix review, Class A/B, not a proven blocker.

## Outdated direct dependencies

All 23 declared direct dependencies are enumerated below using locked versions, installed status and primary registry latest metadata. Root npm outdated returned {}, but root dependencies are missing, so that alone was not interpreted as CURRENT. wanted is the version npm reports inside the declared range. Classification compares locked/current to latest; it is not an instruction to install latest.

| Root/package | Manifest kind/range | Locked/current | Wanted | Registry latest | Classification |
| --- | --- | --- | --- | --- | --- |
| root/concurrently | devDependencies ^10.0.3 | 10.0.3 (not installed) | not reported | 10.0.5 | PATCH AVAILABLE |
| client/@testing-library/dom | dependencies ^10.4.1 | 10.4.1 | 10.4.2 | 10.4.2 | PATCH AVAILABLE |
| client/@testing-library/jest-dom | dependencies ^6.9.1 | 6.9.1 | 6.9.1 | 7.0.1 | MAJOR AVAILABLE |
| client/@testing-library/react | dependencies ^16.3.2 | 16.3.2 | 16.3.3 | 16.3.3 | PATCH AVAILABLE |
| client/@testing-library/user-event | dependencies ^13.5.0 | 13.5.0 | 13.5.0 | 14.6.7 | MAJOR AVAILABLE |
| client/i18next | dependencies ^22.5.1 | 22.5.1 | 22.5.1 | 26.4.2 | MAJOR AVAILABLE |
| client/react | dependencies ^19.2.7 | 19.2.7 | 19.3.0 | 19.3.0 | MINOR AVAILABLE |
| client/react-dom | dependencies ^19.2.7 | 19.2.7 | 19.3.0 | 19.3.0 | MINOR AVAILABLE |
| client/react-i18next | dependencies ^12.3.1 | 12.3.1 | 12.3.1 | 17.0.15 | MAJOR AVAILABLE |
| client/react-markdown | dependencies ^10.1.0 | 10.1.0 | 10.1.0 | 10.1.0 | CURRENT |
| client/react-scripts | dependencies 5.0.1 | 5.0.1 | 5.0.1 | 5.0.1 | CURRENT |
| client/remark-gfm | dependencies ^4.0.1 | 4.0.1 | 4.0.1 | 4.0.1 | CURRENT |
| client/web-vitals | dependencies ^2.1.4 | 2.1.4 | 2.1.4 | 6.2.2 | MAJOR AVAILABLE |
| server/@google/genai | dependencies ^2.12.0 | 2.12.0 | 2.27.0 | 2.27.0 | MINOR AVAILABLE |
| server/bcrypt | dependencies ^6.0.0 | 6.0.0 | 6.0.0 | 6.0.0 | CURRENT |
| server/cors | dependencies ^2.8.6 | 2.8.6 | 2.8.6 | 2.8.6 | CURRENT |
| server/dotenv | dependencies ^17.4.2 | 17.4.2 | 17.4.2 | 18.0.5 | MAJOR AVAILABLE |
| server/express | dependencies ^5.2.1 | 5.2.1 | 5.2.1 | 5.2.1 | CURRENT |
| server/express-session | dependencies ^1.19.0 | 1.19.0 | 1.19.0 | 1.19.0 | CURRENT |
| server/helmet | dependencies ^8.3.0 | 8.3.0 | 8.3.0 | 8.3.0 | CURRENT |
| server/mysql2 | dependencies ^3.22.5 | 3.22.5 | 3.24.5 | 3.24.5 | MINOR AVAILABLE |
| server/nodemailer | dependencies ^9.0.3 | 9.0.3 | 9.1.1 | 10.0.14 | MAJOR AVAILABLE |
| server/openai | dependencies ^6.45.0 | 6.45.0 | 6.49.0 | 7.28.0 | MAJOR AVAILABLE |

Nodemailer has wanted 9.1.1 but latest 10.0.14; OpenAI wanted 6.49.0 but latest 7.28.0. No jsonwebtoken or bcryptjs is declared; bcrypt, OpenAI and @google/genai are the actual packages. ILMU uses the repository's fetch adapter (server/src/ai/providers/ilmu.provider.js), not a separate installed ILMU SDK.

## Deprecated lockfile entries

Messages are summarized as maintenance signals; registry/lock entries do not prove exploitation. All are transitive. Root has none.

| Root / locked entry | Signal |
| --- | --- |
| client/node_modules/@babel/plugin-proposal-class-properties@7.18.6 | This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-class-properties … |
| client/node_modules/@babel/plugin-proposal-nullish-coalescing-operator@7.18.6 | This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-nullish-coalescin… |
| client/node_modules/@babel/plugin-proposal-numeric-separator@7.18.6 | This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-numeric-separator… |
| client/node_modules/@babel/plugin-proposal-optional-chaining@7.21.0 | This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-optional-chaining… |
| client/node_modules/@babel/plugin-proposal-private-methods@7.18.6 | This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-private-methods i… |
| client/node_modules/@humanwhocodes/config-array@0.13.0 | Use @eslint/config-array instead |
| client/node_modules/@humanwhocodes/object-schema@2.0.3 | Use @eslint/object-schema instead |
| client/node_modules/abab@2.0.6 | Use your platform's native atob() and btoa() methods instead |
| client/node_modules/babel-preset-react-app/node_modules/@babel/plugin-proposal-private-property-in-object@7.21.11 | This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-private-property-… |
| client/node_modules/domexception@2.0.1 | Use your platform's native DOMException instead |
| client/node_modules/eslint@8.57.1 | This version is no longer supported. Please see https://eslint.org/version-support for other options. |
| client/node_modules/glob@7.2.3 | Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update… |
| client/node_modules/inflight@1.0.6 | This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key va… |
| client/node_modules/q@1.5.1 | You or someone you depend on is using Q, the JavaScript Promise library that gave JavaScript developers strong feelings about promises. They can almost cer… |
| client/node_modules/rimraf@3.0.2 | Rimraf versions prior to v4 are no longer supported |
| client/node_modules/rollup-plugin-terser@7.0.2 | This package has been deprecated and is no longer maintained. Please use @rollup/plugin-terser |
| client/node_modules/sourcemap-codec@1.4.8 | Please use @jridgewell/sourcemap-codec instead |
| client/node_modules/stable@0.1.8 | Modern JS already guarantees Array#sort() is a stable sort, so this library is deprecated. See the compatibility table on MDN: https://developer.mozilla.or… |
| client/node_modules/svgo@1.3.2 | This SVGO version is no longer supported. Upgrade to v2.x.x. |
| client/node_modules/uuid@8.3.2 | uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will l… |
| client/node_modules/w3c-hr-time@1.0.2 | Use your platform's native performance.now() and performance.timeOrigin. |
| client/node_modules/whatwg-encoding@1.0.5 | Use @exodus/bytes instead for a more spec-conformant and faster implementation |
| client/node_modules/workbox-build/node_modules/source-map@0.8.0-beta.0 | The work that was done in this beta branch won't be included in future versions |
| client/node_modules/workbox-cacheable-response@6.6.0 | workbox-background-sync@6.6.0 |
| client/node_modules/workbox-google-analytics@6.6.0 | It is not compatible with newer versions of GA starting with v4, as long as you are using GAv3 it should be ok, but the package is not longer being maintai… |
| server/node_modules/node-domexception@1.0.0 | Use your platform's native DOMException instead |

Server node-domexception@1.0.0 is a transitive compatibility shim; no direct runtime failure is shown. CRA Babel proposal plugins, ESLint8, old glob/inflight/rimraf, SVGO1, Rollup terser plugin and Workbox components are ecosystem maintenance debt. Existing Node DEP0176 fs.F_OK and Scenario useEffect warnings belong to R4-04 classification; no warning remediation was attempted here.

## Remediation classes and recommended order

- **Class A — low-risk maintenance candidates:** concurrently10.0.5/shell-quote1.9.0 for fixed local scripts; compatible testing-library patches; compatible qs update after parent constraint review. Not applied.
- **Class B — controlled upgrades:** mysql2 compatible minor with DB/TLS regression; Node24 supported-line patch with native bcrypt/SDK/startup checks; local yaml peer-resolution repair under a bounded install/reproducibility task; OpenAI6/GenAI2 compatible minors only when R5 requires them. React/react-dom must move together if later approved.
- **Class C — major migration/version review:** Nodemailer9→patched10 needs a narrow breaking-change review plus SMTP/auth/reset/guardian tests; OpenAI7, dotenv18, i18next26/react-i18next17, user-event14/jest-dom7/web-vitals6; CRA build/test replacement requires explicit architecture approval.
- **Class D — accept/monitor proposal, not actual Owner acceptance:** CRA/Jest/build-only findings with trusted source/config and no publicly exposed dev server; deprecated shims; latest-only feature upgrades. Record conditions and revisit in R8/Post-Capstone or if exposure changes. Unpatched braces/node-forge require parent replacement or bounded exposure control, not an invented patch.
- **Class E — NONE established.** SMTP High remains a priority production-path risk; absence of a demonstrated exploit is a limitation, not proof of safety.

Recommended execution order (future authorization required):

1. Independent audit characterization review is accepted. Complete the separately scoped R4-03A_DEPENDENCY_SECURITY_CORRECTIVE before R4 is considered complete: resolve or explicitly govern SMTP production-path security and select a supported Nodemailer 10.x candidate using fresh execution-time advisories/registry and Cyberly compatibility verification. Do not treat 9.1.1 or a fixed 10.0.6 recommendation as complete clearance. This persistence task does not begin R4-03A.
2. Confirm/pin actual operational Node authority; review supported Node24 patches and mysql2/qs compatible fixes with targeted regression.
3. Resolve local missing root dependency and client yaml peer issue in an isolated authorized setup task; never clean current evidence or repair this workspace automatically.
4. Address bounded tooling fixes (concurrently, websocket-driver, build leaf packages) where constraints permit; do not force npm fixes or accept react-scripts0.0.0.
5. Scope SDK compatibility under R5 and defer broad CRA/i18n/test migration to R8 or Post-Capstone.

## Complete Critical/High package register

Every npm Critical/High entry (root 2, client 70, server 1) is listed. Paths below are one observed installed dependency path, not every possible path; root uses lockfile edges because its node_modules is absent. Client manifests classify these as production dependencies, but reachability uses actual scripts/config. TEST_ONLY entries are loaded through CRA Jest; BUILD_TIME_ONLY through CRA webpack/SVGO/PostCSS/Workbox; DEV_TOOLING_ONLY covers dev server and shared build/test glob/config utilities. None is asserted present in a browser bundle without a bundle trace.

Advisory identifiers include inherited propagation: a parent metavulnerability does not have its own new CVE. See the advisory register for affected/patched versions of the leaf cause. npm true means a reported fix candidate, not verified safe compatible remediation; major-upgrade requirements for those boolean suggestions remain UNKNOWN until parent constraints are checked. In particular propagated parents of unpatched leaf advisories are not actually cleared by an npm boolean. Placeholder downgrade suggestions are rejected.

| Root/package (severity; directness) | Locked versions; observed dependency path | npm affected range | Leaf advisory IDs | npm fix / major implication | Reachability; materiality/class |
| --- | --- | --- | --- | --- | --- |
| root/concurrently (high; direct) | 10.0.3; root > concurrently@missing | 9.2.1 - 9.2.3 \|\| 10.0.0 - 10.0.3 | GHSA-395f-4hp3-45gv | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| root/shell-quote (high; transitive) | 1.8.4; root > concurrently@10.0.3 > shell-quote@1.8.4 | <=1.8.4 | GHSA-395f-4hp3-45gv | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/console (high; transitive) | 27.5.1,28.1.3; client > react-scripts@5.0.1 > jest-watch-typeahead@1.1.0 > jest-watcher@28.1.3 > @jest/test-result@28.1.3 > @jest/console@28.1.3 | 25.4.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/core (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/environment (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-circus@27.5.1 > @jest/environment@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/fake-timers (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-environment-jsdom@27.5.1 > @jest/fake-timers@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/globals (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-runtime@27.5.1 > @jest/globals@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/reporters (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > @jest/reporters@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/test-result (high; transitive) | 27.5.1,28.1.3; client > react-scripts@5.0.1 > jest-watch-typeahead@1.1.0 > jest-watcher@28.1.3 > @jest/test-result@28.1.3 | 25.4.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/test-sequencer (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > @jest/test-sequencer@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@jest/transform (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > babel-jest@27.5.1 > @jest/transform@27.5.1 | <=30.2.0 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@svgr/plugin-svgo (high; transitive) | 5.5.0; client > react-scripts@5.0.1 > @svgr/webpack@5.5.0 > @svgr/plugin-svgo@5.5.0 | <=5.5.0 | GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@svgr/webpack (high; transitive) | 5.5.0; client > react-scripts@5.0.1 > @svgr/webpack@5.5.0 | 4.0.0 - 5.5.0 | GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@typescript-eslint/eslint-plugin (high; transitive) | 5.62.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > @typescript-eslint/eslint-plugin@5.62.0 | 4.0.1-alpha.0 - 8.2.1-alpha.25 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@typescript-eslint/experimental-utils (high; transitive) | 5.62.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > eslint-plugin-jest@25.7.0 > @typescript-eslint/experimental-utils@5.62.0 | >=5.9.2-alpha.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@typescript-eslint/parser (high; transitive) | 5.62.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > @typescript-eslint/eslint-plugin@5.62.0 > @typescript-eslint/parser@5.62.0 | 3.10.2-alpha.0 - 8.2.1-alpha.25 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@typescript-eslint/type-utils (high; transitive) | 5.62.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > @typescript-eslint/eslint-plugin@5.62.0 > @typescript-eslint/type-utils@5.62.0 | 5.9.2-alpha.0 - 8.2.1-alpha.25 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@typescript-eslint/typescript-estree (high; transitive) | 5.62.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > @typescript-eslint/eslint-plugin@5.62.0 > @typescript-eslint/type-utils@5.62.0 > @typescript-eslint/typescript-estree@5.62.0 | 3.10.2-alpha.0 - 8.2.1-alpha.25 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/@typescript-eslint/utils (high; transitive) | 5.62.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > @typescript-eslint/eslint-plugin@5.62.0 > @typescript-eslint/type-utils@5.62.0 > @typescript-eslint/utils@5.62.0 | <=8.2.1-alpha.25 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/babel-jest (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > babel-jest@27.5.1 | 24.2.0-alpha.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/bfj (high; transitive) | 7.1.0; client > react-scripts@5.0.1 > bfj@7.1.0 | 7.1.0 - 9.1.2 | GHSA-qpx9-hpmf-5gmw | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/brace-expansion (high; transitive) | 1.1.15,2.1.1; client > react-scripts@5.0.1 > eslint@8.57.1 > minimatch@3.1.5 > brace-expansion@1.1.15 | <=1.1.20 \|\| 2.0.0 - 2.1.6 | GHSA-3jxr-9vmj-r5cp, GHSA-6j4f-fj2g-mc7p, GHSA-mh99-v99m-4gvg, GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-rgw5-rvv9-x895 | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/braces (high; transitive) | 3.0.3; client > react-scripts@5.0.1 > eslint-webpack-plugin@3.2.0 > micromatch@4.0.8 > braces@3.0.3 | * | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder; leaf has no published patch | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/browserslist (high; transitive) | 4.28.2; client > react-scripts@5.0.1 > @babel/core@7.29.7 > @babel/helper-compilation-targets@7.29.7 > browserslist@4.28.2 | <=4.28.6 | GHSA-73wf-gq98-2v4g, GHSA-c83g-rgw3-j3cx | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/chokidar (high; transitive) | 3.6.0; client > react-scripts@5.0.1 > react-dev-utils@12.0.1 > fork-ts-checker-webpack-plugin@6.5.3 > chokidar@3.6.0 | 2.0.0 - 3.6.0 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/css-select (high; transitive) | 2.1.0; client > react-scripts@5.0.1 > @svgr/webpack@5.5.0 > @svgr/plugin-svgo@5.5.0 > svgo@1.3.2 > css-select@2.1.0 | <=3.1.0 | GHSA-rp65-9cf3-cjxr | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/eslint-config-react-app (high; transitive) | 7.0.1; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 | >=6.0.0-next.64 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/eslint-plugin-testing-library (high; transitive) | 5.11.1; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > eslint-plugin-testing-library@5.11.1 | 5.0.5 - 7.0.0-beta.6 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/eslint-webpack-plugin (high; transitive) | 3.2.0; client > react-scripts@5.0.1 > eslint-webpack-plugin@3.2.0 | * | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/expect (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-circus@27.5.1 > expect@27.5.1 | 21.0.0-beta.1 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/fast-glob (high; transitive) | 3.3.3; client > react-scripts@5.0.1 > react-dev-utils@12.0.1 > globby@11.1.0 > fast-glob@3.3.3 | * | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/fast-uri (high; transitive) | 3.1.2; client > react-scripts@5.0.1 > @pmmmwh/react-refresh-webpack-plugin@0.5.17 > schema-utils@4.3.3 > ajv-formats@2.1.1 > ajv@8.20.0 > fast-uri@3.1.2 | 3.0.0 - 3.1.7 | GHSA-4c8g-83qw-93j6, GHSA-7p8r-x3mc-p8w7, GHSA-f65p-4m7j-42xc, GHSA-fph4-wmhf-6fwf, GHSA-hrr3-gc8f-f4qj, GHSA-jqff-g426-hqxp, GHSA-qw65-cvwx-89v3, GHSA-v2hh-gcrm-f6hx | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/fork-ts-checker-webpack-plugin (high; transitive) | 6.5.3; client > react-scripts@5.0.1 > react-dev-utils@12.0.1 > fork-ts-checker-webpack-plugin@6.5.3 | 0.4.7 - 4.0.0-beta.5 \|\| 6.0.0-alpha.1 - 9.0.3 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/globby (high; transitive) | 11.1.0; client > react-scripts@5.0.1 > eslint-config-react-app@7.0.1 > @typescript-eslint/parser@5.62.0 > @typescript-eslint/typescript-estree@5.62.0 > globby@11.1.0 | >=8.0.0 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/http-proxy-middleware (high; transitive) | 2.0.10; client > react-scripts@5.0.1 > webpack-dev-server@4.15.2 > http-proxy-middleware@2.0.10 | >=0.3.0 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest-watch-typeahead@1.1.0 > jest@27.5.1 | 24.2.0-alpha.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-circus (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-circus@27.5.1 | 20.1.0-alpha.1 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-cli (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > jest-cli@27.5.1 | 23.5.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-config (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 | 18.1.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-environment-jsdom (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-environment-jsdom@27.5.1 | 24.2.0-alpha.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-environment-node (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-environment-node@27.5.1 | 24.2.0-alpha.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-haste-map (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > babel-jest@27.5.1 > @jest/transform@27.5.1 > jest-haste-map@27.5.1 | 18.1.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-jasmine2 (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-jasmine2@27.5.1 | 18.5.0-alpha.7da3df39 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-message-util (high; transitive) | 27.5.1,28.1.3; client > react-scripts@5.0.1 > jest-watch-typeahead@1.1.0 > jest-watcher@28.1.3 > @jest/test-result@28.1.3 > @jest/console@28.1.3 > jest-message-util@28.1.3 | 18.5.0-alpha.7da3df39 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-resolve (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest-resolve@27.5.1 | 18.1.0 - 19.0.2 \|\| 24.2.0-alpha.0 - 24.5.0 \|\| 27.1.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-resolve-dependencies (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-resolve-dependencies@27.5.1 | 23.3.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-runner (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-runner@27.5.1 | 21.0.0-alpha.1 - 30.2.0 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-runtime (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > @jest/test-sequencer@27.5.1 > jest-runtime@27.5.1 | 18.1.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-snapshot (high; transitive) | 27.5.1; client > react-scripts@5.0.1 > jest@27.5.1 > @jest/core@27.5.1 > jest-config@27.5.1 > jest-circus@27.5.1 > jest-snapshot@27.5.1 | 23.3.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-watch-typeahead (high; transitive) | 1.1.0; client > react-scripts@5.0.1 > jest-watch-typeahead@1.1.0 | 0.6.0 - 2.2.2 | GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6 | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jest-watcher (high; transitive) | 28.1.3,27.5.1; client > react-scripts@5.0.1 > jest-watch-typeahead@1.1.0 > jest-watcher@28.1.3 | 25.4.0 - 30.2.0 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | TEST_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/js-yaml (high; transitive) | 4.2.0,3.15.0; client > react-scripts@5.0.1 > @svgr/webpack@5.5.0 > @svgr/plugin-svgo@5.5.0 > svgo@1.3.2 > js-yaml@3.15.0 | 3.0.0 - 3.15.1 \|\| 4.0.0 - 4.3.1 | GHSA-2883-xcg3-v3hh, GHSA-52cp-r559-cp3m, GHSA-5p4m-2wfm-xmqj | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/jsonpath (high; transitive) | 1.3.0; client > react-scripts@5.0.1 > bfj@7.1.0 > jsonpath@1.3.0 | * | GHSA-qpx9-hpmf-5gmw | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/micromatch (high; transitive) | 4.0.8; client > react-scripts@5.0.1 > babel-jest@27.5.1 > @jest/transform@27.5.1 > micromatch@4.0.8 | >=0.2.0 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/nanoid (high; transitive) | 3.3.12; client > react-scripts@5.0.1 > postcss@8.5.15 > nanoid@3.3.12 | <=3.3.17 | GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8 | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/node-forge (high; transitive) | 1.4.0; client > react-scripts@5.0.1 > webpack-dev-server@4.15.2 > selfsigned@2.4.1 > node-forge@1.4.0 | * | GHSA-86w9-cpqp-85rv | react-scripts@0.0.0; major=true; REJECT placeholder; leaf has no published patch | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/nth-check (high; transitive) | 1.0.2; client > react-scripts@5.0.1 > @svgr/webpack@5.5.0 > @svgr/plugin-svgo@5.5.0 > svgo@1.3.2 > css-select@2.1.0 > nth-check@1.0.2 | <2.0.1 | GHSA-rp65-9cf3-cjxr | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/postcss (high; transitive) | 8.5.15,7.0.39; client > react-scripts@5.0.1 > css-loader@6.11.0 > icss-utils@5.1.0 > postcss@8.5.15 | <=8.5.22 | GHSA-6g55-p6wh-862q, GHSA-7fh5-64p2-3v2j, GHSA-fxqj-rqcc-2cmp, GHSA-qx2v-qp2m-jg93, GHSA-r28c-9q8g-f849 | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/react-dev-utils (high; transitive) | 12.0.1; client > react-scripts@5.0.1 > react-dev-utils@12.0.1 | 6.0.0-next.03604a46 - 6.0.0-next.a671462c \|\| >=6.0.6-next.9b4009d7 | GHSA-vfj7-8cjw-p6xm | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/react-scripts (high; direct) | 5.0.1; client > react-scripts@5.0.1 | >=0.1.0 | GHSA-2p49-hgcm-8545, GHSA-4v9v-hfq4-rm2v, GHSA-4vpr-x523-8j87, GHSA-5c6j-r48x-rmvq, GHSA-6g55-p6wh-862q, GHSA-79cf-xcqc-c78w, GHSA-7fh5-64p2-3v2j, GHSA-86w9-cpqp-85rv, GHSA-9jgg-88mc-972h, GHSA-f5vj-f2hx-8m93, GHSA-fxqj-rqcc-2cmp, GHSA-g84c-rxfj-3j2c, GHSA-m28w-2pqf-7qgj, GHSA-mx8g-39q3-5c79, GHSA-qj8w-gfj5-8c6v, GHSA-qx2v-qp2m-jg93, GHSA-r28c-9q8g-f849, GHSA-rp65-9cf3-cjxr, GHSA-vfj7-8cjw-p6xm, GHSA-vpq2-c234-7xj6, GHSA-w27v-7q3p-w38r, GHSA-w5hq-g745-h8pq | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; architectural debt C/D |
| client/rollup-plugin-terser (high; transitive) | 7.0.2; client > react-scripts@5.0.1 > workbox-webpack-plugin@6.6.0 > workbox-build@6.6.0 > rollup-plugin-terser@7.0.2 | 3.0.0 \|\| >=4.0.4 | GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/selfsigned (high; transitive) | 2.4.1; client > react-scripts@5.0.1 > webpack-dev-server@4.15.2 > selfsigned@2.4.1 | 1.1.1 - 4.0.1 | GHSA-86w9-cpqp-85rv | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/serialize-javascript (high; transitive) | 4.0.0,6.0.2; client > react-scripts@5.0.1 > css-minimizer-webpack-plugin@3.4.1 > serialize-javascript@6.0.2 | <=7.0.4 | GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/shell-quote (high; transitive) | 1.8.4; client > react-scripts@5.0.1 > react-dev-utils@12.0.1 > shell-quote@1.8.4 | <=1.8.4 | GHSA-395f-4hp3-45gv | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/svgo (high; transitive) | 2.8.2,1.3.2; client > react-scripts@5.0.1 > @svgr/webpack@5.5.0 > @svgr/plugin-svgo@5.5.0 > svgo@1.3.2 | 1.0.0 - 2.8.3 | GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r | react-scripts@0.0.0; major=true; REJECT placeholder | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/tailwindcss (high; transitive) | 3.4.19; client > react-scripts@5.0.1 > tailwindcss@3.4.19 | <=0.0.0-oxide-insiders.ff2c25f \|\| 2.1.0-canary.1 - 3.4.19 | GHSA-vfj7-8cjw-p6xm | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/underscore (high; transitive) | 1.13.6; client > react-scripts@5.0.1 > bfj@7.1.0 > jsonpath@1.3.0 > underscore@1.13.6 | <=1.13.7 | GHSA-qpx9-hpmf-5gmw | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/webpack-dev-middleware (high; transitive) | 5.3.4; client > react-scripts@5.0.1 > webpack-dev-server@4.15.2 > webpack-dev-middleware@5.3.4 | <7.4.5 | GHSA-g84c-rxfj-3j2c | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/webpack-dev-server (high; transitive) | 4.15.2; client > react-scripts@5.0.1 > @pmmmwh/react-refresh-webpack-plugin@0.5.17 > webpack-dev-server@4.15.2 | * | GHSA-4v9v-hfq4-rm2v, GHSA-79cf-xcqc-c78w, GHSA-86w9-cpqp-85rv, GHSA-9jgg-88mc-972h, GHSA-f5vj-f2hx-8m93, GHSA-g84c-rxfj-3j2c, GHSA-m28w-2pqf-7qgj, GHSA-mx8g-39q3-5c79, GHSA-vfj7-8cjw-p6xm, GHSA-w5hq-g745-h8pq | react-scripts@0.0.0; major=true; REJECT placeholder | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/websocket-driver (critical; transitive) | 0.7.4; client > react-scripts@5.0.1 > webpack-dev-server@4.15.2 > sockjs@0.3.24 > faye-websocket@0.11.4 > websocket-driver@0.7.4 | <=0.7.4 | GHSA-mp7j-qc5w-4988, GHSA-xv26-6w52-cph6 | npm true; compatible candidate needs parent review | DEV_TOOLING_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/workbox-build (high; transitive) | 6.6.0; client > react-scripts@5.0.1 > workbox-webpack-plugin@6.6.0 > workbox-build@6.6.0 | 5.0.0-alpha.0 - 7.0.0 | GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| client/workbox-webpack-plugin (high; transitive) | 6.6.0; client > react-scripts@5.0.1 > workbox-webpack-plugin@6.6.0 | 5.0.0-alpha.0 - 7.0.0 | GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v | npm true; compatible candidate needs parent review | BUILD_TIME_ONLY; tooling exposure; A/B candidate or D, not live blocker |
| server/nodemailer (high; direct) | 9.0.3; server > nodemailer@9.0.3 | <=10.0.5 | GHSA-2x7j-588g-ccc2, GHSA-6vj9-mwq6-2f5v, GHSA-8m3c-c648-2xjj, GHSA-8vvx-rff5-p5rq, GHSA-cc9r-2j5m-2m83, GHSA-v53p-9fqp-m79j, GHSA-wmmp-3585-3rmp | npm true; 10.0.6 is an advisory minimum; fresh supported10.x selection in R4-03A requires major9→10 review | PRODUCTION_REACHABLE (SMTP conditional); production-path priority; C scoped/B validation, no E established |

## Primary advisory affected/patched register

Read-only GitHub advisory API captured 52 advisory-bearing Critical/High identifiers plus five supplementary identifiers for inherited lower-severity causes and the other server findings (57 total). First patched versions below are per advisory/branch, not a guarantee that one candidate fixes all advisories. NONE means the advisory does not publish a patched version. Published ranges can differ from npm's aggregate parent ranges. Moderate causes contributing to a High aggregate are retained. CVE is shown when supplied; GHSA remains the identifier otherwise.

| GHSA / CVE | Package | Advisory affected range | First patched version |
| --- | --- | --- | --- |
| [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) / CVE-2026-84375 | js-yaml | >= 4.0.0, < 4.3.2 | 4.3.2 |
| [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) / CVE-2026-84375 | js-yaml | >= 3.0.0, < 3.15.2 | 3.15.2 |
| [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) / CVE-2026-67214 | nanoid | < 3.3.16 | 3.3.16 |
| [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) / CVE-2026-67214 | nanoid | >= 4.0.0, < 5.1.16 | 5.1.16 |
| [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) / CVE-2026-73650 | svgo | >= 1.0.0, < 2.8.3 | 2.8.3 |
| [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) / CVE-2026-73650 | svgo | >= 3.0.0, < 3.3.4 | 3.3.4 |
| [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) / CVE-2026-73650 | svgo | >= 4.0.0, < 4.0.2 | 4.0.2 |
| [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) / CVE-2026-67213 | nanoid | >= 4.0.0, < 5.1.6 | 5.1.6 |
| [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) / CVE-2026-67213 | nanoid | < 3.3.18 | 3.3.18 |
| [GHSA-2x7j-588g-ccc2](https://github.com/advisories/GHSA-2x7j-588g-ccc2) / no known CVE | nodemailer | < 9.1.0 | 9.1.0 |
| [GHSA-395f-4hp3-45gv](https://github.com/advisories/GHSA-395f-4hp3-45gv) / CVE-2026-13311 | shell-quote | <= 1.8.4 | 1.9.0 |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) / CVE-2026-13149 | brace-expansion | >= 3.0.0, < 5.0.7 | 5.0.7 |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) / CVE-2026-13149 | brace-expansion | < 1.1.16 | 1.1.16 |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) / CVE-2026-13149 | brace-expansion | >= 2.0.0, < 2.1.2 | 2.1.2 |
| [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) / CVE-2026-13676 | fast-uri | >= 4.0.0, < 4.0.1 | 4.0.1 |
| [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) / CVE-2026-13676 | fast-uri | >= 3.0.0, < 3.1.3 | 3.1.3 |
| [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) / CVE-2026-13676 | fast-uri | >= 2.3.1, < 2.4.2 | 2.4.2 |
| [GHSA-4v9v-hfq4-rm2v](https://github.com/advisories/GHSA-4v9v-hfq4-rm2v) / CVE-2025-30359 | webpack-dev-server | <= 5.2.0 | 5.2.1 |
| [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) / CVE-2026-84369 | svgo | >= 1.0.0, < 2.8.4 | 2.8.4 |
| [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) / CVE-2026-84369 | svgo | >= 3.0.0, < 3.3.5 | 3.3.5 |
| [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) / CVE-2026-84369 | svgo | >= 4.0.0, < 4.1.0 | 4.1.0 |
| [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) / CVE-2026-59869 | js-yaml | >= 3.0.0, < 3.15.0 | 3.15.0 |
| [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) / CVE-2026-59869 | js-yaml | >= 4.0.0, < 4.3.0 | 4.3.0 |
| [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) / no known CVE | serialize-javascript | <= 7.0.2 | 7.0.3 |
| [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) / no known CVE | js-yaml | >= 4.0.0, < 4.3.1 | 4.3.1 |
| [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) / no known CVE | js-yaml | >= 3.0.0, < 3.15.1 | 3.15.1 |
| [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) / CVE-2026-45623 | postcss | <= 8.5.11 | 8.5.12 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / CVE-2026-102276 | brace-expansion | >= 4.0.0, < 5.0.10 | 5.0.10 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / CVE-2026-102276 | brace-expansion | >= 3.0.0, < 3.0.7 | 3.0.7 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / CVE-2026-102276 | brace-expansion | >= 2.0.0, < 2.1.5 | 2.1.5 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / CVE-2026-102276 | brace-expansion | < 1.1.19 | 1.1.19 |
| [GHSA-6vj9-mwq6-2f5v](https://github.com/advisories/GHSA-6vj9-mwq6-2f5v) / no known CVE | nodemailer | >= 5.0.0, < 10.0.2 | 10.0.2 |
| [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) / CVE-2026-73088 | browserslist | <= 4.28.6 | 4.28.7 |
| [GHSA-79cf-xcqc-c78w](https://github.com/advisories/GHSA-79cf-xcqc-c78w) / CVE-2026-6402 | webpack-dev-server | <= 5.2.3 | 5.2.4 |
| [GHSA-7fh5-64p2-3v2j](https://github.com/advisories/GHSA-7fh5-64p2-3v2j) / CVE-2023-44270 | postcss | < 8.4.31 | 8.4.31 |
| [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) / CVE-2026-18446 | fast-uri | < 2.4.4 | 2.4.4 |
| [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) / CVE-2026-18446 | fast-uri | >= 3.0.0, < 3.1.5 | 3.1.5 |
| [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) / CVE-2026-18446 | fast-uri | >= 4.0.0, < 4.1.2 | 4.1.2 |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) / CVE-2026-85393 | node-forge | <= 1.4.0 | NONE |
| [GHSA-8m3c-c648-2xjj](https://github.com/advisories/GHSA-8m3c-c648-2xjj) / no known CVE | nodemailer | <= 9.1.0 | 9.1.1 |
| [GHSA-8vvx-rff5-p5rq](https://github.com/advisories/GHSA-8vvx-rff5-p5rq) / no known CVE | nodemailer | < 10.0.2 | 10.0.2 |
| [GHSA-9jgg-88mc-972h](https://github.com/advisories/GHSA-9jgg-88mc-972h) / CVE-2025-30360 | webpack-dev-server | <= 5.2.0 | 5.2.1 |
| [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) / CVE-2026-73089 | browserslist | <= 4.28.6 | 4.28.7 |
| [GHSA-cc9r-2j5m-2m83](https://github.com/advisories/GHSA-cc9r-2j5m-2m83) / no known CVE | nodemailer | >= 6.9.16, < 9.1.0 | 9.1.0 |
| [GHSA-f5vj-f2hx-8m93](https://github.com/advisories/GHSA-f5vj-f2hx-8m93) / CVE-2026-14620 | webpack-dev-server | <= 5.2.5 | 5.2.6 |
| [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) / CVE-2026-75975 | fast-uri | >= 2.3.1, < 2.4.5 | 2.4.5 |
| [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) / CVE-2026-75975 | fast-uri | >= 3.0.0, < 3.1.6 | 3.1.6 |
| [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) / CVE-2026-75975 | fast-uri | >= 4.0.0, < 4.1.3 | 4.1.3 |
| [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) / CVE-2026-75899 | fast-uri | >= 2.4.1, < 2.4.5 | 2.4.5 |
| [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) / CVE-2026-75899 | fast-uri | >= 3.1.2, < 3.1.6 | 3.1.6 |
| [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) / CVE-2026-75899 | fast-uri | >= 4.0.0, < 4.1.3 | 4.1.3 |
| [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) / CVE-2026-69153 | postcss | <= 8.5.22 | 8.5.23 |
| [GHSA-g84c-rxfj-3j2c](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) / CVE-2026-76844 | webpack-dev-middleware | >= 8.0.0, < 8.3.0 | 8.3.0 |
| [GHSA-g84c-rxfj-3j2c](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) / CVE-2026-76844 | webpack-dev-middleware | < 7.4.5 | 7.4.6 |
| [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) / CVE-2026-86472 | fast-uri | < 2.4.7 | 2.4.7 |
| [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) / CVE-2026-86472 | fast-uri | >= 3.0.0, < 3.1.8 | 3.1.8 |
| [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) / CVE-2026-86472 | fast-uri | >= 4.0.0, < 4.1.5 | 4.1.5 |
| [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) / CVE-2026-76172 | fast-uri | >= 2.3.1, < 2.4.5 | 2.4.5 |
| [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) / CVE-2026-76172 | fast-uri | >= 3.0.0, < 3.1.6 | 3.1.6 |
| [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) / CVE-2026-76172 | fast-uri | >= 4.0.0, < 4.1.3 | 4.1.3 |
| [GHSA-m28w-2pqf-7qgj](https://github.com/advisories/GHSA-m28w-2pqf-7qgj) / CVE-2026-14631 | webpack-dev-server | <= 5.2.5 | 5.2.6 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / CVE-2026-14257 | brace-expansion | >= 4.0.0, < 5.0.8 | 5.0.8 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / CVE-2026-14257 | brace-expansion | >= 3.0.0, < 3.0.3 | 3.0.3 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / CVE-2026-14257 | brace-expansion | >= 2.0.0, < 2.1.3 | 2.1.3 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / CVE-2026-14257 | brace-expansion | < 1.1.17 | 1.1.17 |
| [GHSA-mp7j-qc5w-4988](https://github.com/advisories/GHSA-mp7j-qc5w-4988) / CVE-2026-54490 | websocket-driver | < 0.7.5 | 0.7.5 |
| [GHSA-mx8g-39q3-5c79](https://github.com/advisories/GHSA-mx8g-39q3-5c79) / CVE-2026-9595 | webpack-dev-server | < 5.2.5 | 5.2.5 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) / CVE-2026-102277 | brace-expansion | >= 4.0.0, < 5.0.12 | 5.0.12 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) / CVE-2026-102277 | brace-expansion | >= 3.0.0, < 3.0.9 | 3.0.9 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) / CVE-2026-102277 | brace-expansion | >= 2.0.0, < 2.1.7 | 2.1.7 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) / CVE-2026-102277 | brace-expansion | < 1.1.21 | 1.1.21 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / CVE-2026-102278 | brace-expansion | >= 4.0.0, < 5.0.11 | 5.0.11 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / CVE-2026-102278 | brace-expansion | >= 3.0.0, < 3.0.8 | 3.0.8 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / CVE-2026-102278 | brace-expansion | >= 2.0.0, < 2.1.6 | 2.1.6 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / CVE-2026-102278 | brace-expansion | < 1.1.20 | 1.1.20 |
| [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) / CVE-2026-34043 | serialize-javascript | >= 5.0.0, < 7.0.5 | 7.0.5 |
| [GHSA-qpx9-hpmf-5gmw](https://github.com/advisories/GHSA-qpx9-hpmf-5gmw) / CVE-2026-27601 | underscore | <= 1.13.7 | 1.13.8 |
| [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) / CVE-2026-84292 | fast-uri | < 2.4.6 | 2.4.6 |
| [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) / CVE-2026-84292 | fast-uri | >= 3.0.0, < 3.1.7 | 3.1.7 |
| [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) / CVE-2026-84292 | fast-uri | >= 4.0.0, < 4.1.4 | 4.1.4 |
| [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) / CVE-2026-41305 | postcss | < 8.5.10 | 8.5.10 |
| [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) / CVE-2026-73646 | postcss | <= 8.5.17 | 8.5.18 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) / CVE-2026-69152 | brace-expansion | < 1.1.18 | 1.1.18 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) / CVE-2026-69152 | brace-expansion | >= 2.0.0, < 2.1.4 | 2.1.4 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) / CVE-2026-69152 | brace-expansion | >= 3.0.0, < 3.0.6 | 3.0.6 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) / CVE-2026-69152 | brace-expansion | >= 4.0.0, < 5.0.9 | 5.0.9 |
| [GHSA-rp65-9cf3-cjxr](https://github.com/advisories/GHSA-rp65-9cf3-cjxr) / CVE-2021-3803 | nth-check | < 2.0.1 | 2.0.1 |
| [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) / CVE-2026-16221 | fast-uri | >= 2.3.1, <= 2.4.2 | 2.4.3 |
| [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) / CVE-2026-16221 | fast-uri | >= 3.0.0, <= 3.1.3 | 3.1.4 |
| [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) / CVE-2026-16221 | fast-uri | >= 4.0.0, <= 4.1.0 | 4.1.1 |
| [GHSA-v53p-9fqp-m79j](https://github.com/advisories/GHSA-v53p-9fqp-m79j) / no known CVE | nodemailer | <= 10.0.5 | 10.0.6 |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) / CVE-2026-93687 | braces | <= 3.0.3 | NONE |
| [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) / CVE-2026-84370 | svgo | >= 1.0.0, < 2.8.4 | 2.8.4 |
| [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) / CVE-2026-84370 | svgo | >= 3.0.0, < 3.3.5 | 3.3.5 |
| [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) / CVE-2026-84370 | svgo | >= 4.0.0, < 4.1.0 | 4.1.0 |
| [GHSA-wmmp-3585-3rmp](https://github.com/advisories/GHSA-wmmp-3585-3rmp) / no known CVE | nodemailer | < 9.1.0 | 9.1.0 |
| [GHSA-xv26-6w52-cph6](https://github.com/advisories/GHSA-xv26-6w52-cph6) / CVE-2026-54466 | websocket-driver | < 0.7.5 | 0.7.5 |
| [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) / no known CVE | mysql2 | <= 3.23.0 | 3.23.1 |
| [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) / CVE-2026-82562 | qs | >= 6.14.2, <= 6.15.3 | 6.16.0 |
| [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) / CVE-2026-82417 | qs | >= 2.2.5, < 6.16.0 | 6.16.0 |
| [GHSA-vpq2-c234-7xj6](https://github.com/advisories/GHSA-vpq2-c234-7xj6) / CVE-2026-3449 | @tootallnate/once | >= 3.0.0, < 3.0.1 | 3.0.1 |
| [GHSA-vpq2-c234-7xj6](https://github.com/advisories/GHSA-vpq2-c234-7xj6) / CVE-2026-3449 | @tootallnate/once | < 2.0.1 | 2.0.1 |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) / CVE-2026-41907 | uuid | >= 12.0.0, < 12.0.1 | 12.0.1 |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) / CVE-2026-41907 | uuid | >= 13.0.0, < 13.0.1 | 13.0.1 |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) / CVE-2026-41907 | uuid | < 11.1.1 | 11.1.1 |

## Evidence, verification and limitations

Existing documents inspected: production gap-analysis/03-dependency-map.md (domain dependency map, not package audit), security/public-beta-security-boundary.md, deployment/current-deployment.md, architecture-specification/07-deployment-and-operations.md and R4-01/R4-02 governance/recovery references. No equivalent package-security audit found; this is the single new audit report.

Raw evidence is local/untracked under `review-evidence/r4-03/`: *-verified.json and stderr, verified-commands.json, registry-*.json, advisory-patches.json, advisory-patches-supplement.json and node24-release-metadata.json. Initial wrapper outputs are retained separately; they contain npm usage because of a PowerShell automatic-argument variable error and are **not valid audit evidence**. A corrected npm.cmd wrapper executed all 15 intended commands. Initial PowerShell lockfile parsing also failed on npm's empty root key; successful characterization uses JSON.parse / ConvertFrom-Json -AsHashtable. No package installation or repair occurred.

Commands per root: npm ls --depth=0 --json; npm ls --all --json; npm audit --json; npm audit --omit=dev --json; npm outdated --json. Exit1 from successful audit/outdated JSON denotes findings; root/client ls exit1 denotes the documented tree issues. Primary npm view metadata and GitHub advisory API are read-only; no npm fix/update/install was run. Source searches, package/lock reads, Node engine checks and git authority/status/diff checks complete evidence collection.

Known limits: point-in-time registry/advisory snapshot; no fresh build/test/browser/bundle trace; no installed root graph; client invalid optional peer; no Render runtime/config/installed-byte inspection; no SMTP/provider calls or DB connection; no adversarial exploitation/reproduction; no Node core CVE-by-CVE audit. Declared Node compatibility is narrower than runtime certification. No high finding is dismissed solely by historic R3 passing tests. Repository package scope is not a whole-repository security audit.

Verification boundary: runtime/manifests/lockfiles/config/tests unchanged; tracked diff empty, index empty; one new Markdown audit and untracked evidence only. No deployment, migration, restore, provider call or production action. Existing evidence retained. Manual browser verification is not needed for this audit-only artifact; future approved upgrades require relevant runtime checks. No dependency remediation or deployment is authorized by this audit; documentation persistence follows separate Owner / Control Tower authorization. **R4-03 is not self-closed.**
