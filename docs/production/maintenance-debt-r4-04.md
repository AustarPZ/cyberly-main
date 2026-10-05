# R4-04 Known Warning / Maintenance Debt Classification

Date: 2026-10-05. Repository: `cyberly-main-ui-v2-account-center-r1`; branch: `ui-v2-account-center-r1`; exact characterization HEAD: `448d7e8bf19fe98ef26733eaf72c9b5892e44a27`.

Fresh origin/develop matched HEAD; origin/master and the peeled `r3-staging-accepted-2026-10-03` recovery tag remained `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`. Initial tracked tree was clean and index empty. R4-01/02/03/03A closure and the current R4-04 frontier are Owner / Control Tower supplied authority. **R4-04 maintenance-debt characterization was independently reviewed and accepted by Control Tower on 2026-10-05.** This acceptance validates warning provenance, current materiality classification, remediation priority and deferred-scope decisions. It does not permanently accept all technical debt, authorize remediation, certify staging, live providers or production, or self-close R4-04.

## Canonical register and existing guidance

Existing documents were inspected: the R3 convergence plan identifies this frontier; `dependency-audit-r4-03.md` governs accepted dependency characterization; `cyberguard-public-beta-0.9-certification.md` records the older build warning; `deployment/current-deployment.md` describes static Web and separate API deployment. None provides an equivalent W01-W07 maintenance decision register. This one document consolidates that register and references existing evidence without replacing historical decisions or creating per-warning documents.

Severity describes present materiality, not the word "warning". Future certification prerequisites are explicit below; no currently demonstrated BLOCKER or HIGH item is established by these diagnostics.

| ID | Item / reproduced | Source / root cause | Runtime category | Severity | Recommended action | Remediation risk |
| --- | --- | --- | --- | --- | --- | --- |
| R4-04-W01 | DEP0176; YES, one traced build warning | react-scripts 5.0.1 > react-dev-utils 12.0.1 legacy fs getter | BUILD / DEV_TOOLING | LOW | ACCEPT_MONITOR bounded to approved Node24; Node25+ requires a separate compatibility gate | MEDIUM for a durable dependency remedy |
| R4-04-W02 | Scenario useEffect; YES, current lint line7540 | presentation receipt reads complete objects but keys effect by scalar identity | PRODUCTION_RUNTIME (presentation) / BUILD (lint) | LOW | ACCEPT_MONITOR; document now; future alignment requires identity, malformed/late receipt and focus/scroll tests, preserving no duplicate mutation | MEDIUM |
| R4-04-W03 | DEP0190; YES, byte-identical harness copy | untracked R4-03A harness passes constant args with shell:true | TEST / DEV_TOOLING | LOW | NO_ACTION_TO_PRODUCT; future harnesses SHOULD avoid args with shell:true | LOW |
| R4-04-W04 | No explicit Node authority pin; YES, file/manifest inspection | deployment relies on Render default; local/staging patches differ | OPERATIONS / REPRODUCIBILITY | MEDIUM | FIX_NOW_R4: R4-04A REQUIRED before R5 live-provider staging and Production Certification | MEDIUM |
| R4-04-W05 | yaml optional peer; YES in current and clean isolated installation; dormant loader FAIL | hoisted yaml1 satisfies legacy mandatory parents but conflicts with postcss-load-config6 optional yaml2 | BUILD / LOCAL_SETUP | MEDIUM | PRODUCTION_GATE_ITEM: separately tested compatible resolution OR explicitly governed non-use/reproducibility/residual risk | MEDIUM |
| R4-04-W06 | Missing root concurrently; YES, resolution fails | declared dev dependency has no root installed tree | LOCAL_SETUP / DEV_TOOLING | LOW | ACCEPT_MONITOR until local setup restoration is authorized / one-command dev needed | LOW for install; update security review separate |
| R4-04-W07 | CRA maintenance debt; accepted audit reused, fresh build/test succeed | deprecated framework tooling with accepted maintenance/security debt | ARCHITECTURE / BUILD / TEST / DEV_TOOLING | MEDIUM | DEFER_R8 / POST-CAPSTONE | HIGH |
| R4-04-W08 | Additional unused CompactHeader import; YES, build line42 | existing unused App.jsx import | BUILD / SOURCE MAINTENANCE | LOW | ACCEPT_MONITOR; cleanup only within future approved source maintenance | LOW |

## W01: DEP0176 fs.F_OK

Exact known path reproduced: root `npm run build` delegates to `npm --prefix client run build`, then `react-scripts build`. Diagnostic environment added only `NODE_OPTIONS=--trace-deprecation`, without changing source, configuration, dependency versions or disabling warnings. Local Node: v24.13.0. Build exit0, compiled with warnings.

Exact warning: `[DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead`.

Full stack is in `review-evidence/r4-04/build-trace.stderr.txt`. Its initial frames are:

```text
client/node_modules/react-dev-utils/checkRequiredFiles.js:19:34
Array.forEach
checkRequiredFiles (.../react-dev-utils/checkRequiredFiles.js:17:11)
Object.<anonymous> (.../react-scripts/scripts/build.js:50:6)
Module._compile (node:internal/modules/cjs/loader:1761:14)
```

At line19, the transitive package calls `fs.accessSync(filePath, fs.F_OK)`. The dependency is reached from direct react-scripts' required-file preflight. No Cyberly-owned source JS frame appears in this stack; the first project-owned invocation is the root/client package build script. Search of first-party client/server/scripts code found no `fs.F_OK`, `fs.access` or `fs.constants.F_OK` matches. This is vendor/tooling provenance, not a learner or Express API call path.

Frequency: one DEP0176 message in this fresh build process, also present in two historical account-center build logs. No claim about every runtime/start/test command's frequency. [Node's official deprecation history](https://nodejs.org/api/deprecations.html#DEP0176) places runtime deprecation at Node24 and removal of these getters at Node25. Removal is a future compatibility signal, not proof that this particular fs.accessSync call currently fails or will necessarily fail (an undefined mode can have default semantics). **ACCEPT_MONITOR is valid under the current approved Node24 runtime line. Do not upgrade Cyberly build/runtime to Node25+ while this toolchain path remains unresolved without a separately reviewed compatibility gate.** Monitor within the approved Node24 policy; evaluate a durable upstream/tooling remedy in the later maintenance phase, without hand-editing node_modules or suppressing warnings.

## W02: Scenario presentation receipt effect

Fresh ESLint output:

```text
src\App.jsx
Line 7540:6: React Hook useEffect has missing dependencies: 'pendingScenarioResume', 'user', and 'view.currentStep'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
```

Historical account-center logs reported line7572; current HEAD places the same receipt effect body at `client/src/App.jsx:7525-7542`, dependency array at7540. The location was verified against current source rather than copying the old line number.

Actual effect body and array:

```jsx
useEffect(() => {
  // Presentation-only receipt: a save must begin and finish in the same identity.
  // A replacement while busy invalidates the receipt rather than adopting it.
  const stamp = JSON.stringify([user?.id, authScopeRevision, acceptedNavigationGeneration,
    acceptedHash, view.mode, view.attempt?.id, view.currentStep?.id, scenarioLocale,
    pendingScenarioResume?.targetRevision, exactResume.target?.targetRevision]);
  const previous = feedbackRevealRef.current;
  const receipt = busy && !previous.busy ? stamp : previous.stamp === stamp ? previous.stamp : null;
  feedbackRevealRef.current = { busy, stamp: receipt, feedback: decisionFeedback };
  if (!decisionFeedback || decisionFeedback === previous.feedback || busy || !user ||
    view.mode !== "attempt" || !view.currentStep || pendingScenarioResume || receipt !== stamp) return;
  const target = scenarioFeedbackRef.current;
  if (!target?.isConnected) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "auto", block: "start" });
}, [decisionFeedback, busy, user?.id, authScopeRevision, acceptedNavigationGeneration,
  acceptedHash, view.mode, view.attempt?.id, view.currentStep?.id, scenarioLocale,
  pendingScenarioResume?.targetRevision, exactResume.target?.targetRevision]);
```

Reads: the listed scalar identity, busy/feedback, truthiness of user/currentStep/pendingScenarioResume, previous receipt ref and feedback DOM ref. Writes: only `feedbackRevealRef.current` and DOM focus/scroll. It does not write React state, fetch, save a decision, complete an attempt, or navigate. React ref containers are stable. There is no custom function captured by this effect to assess as memoized/unmemoized; JSON.stringify is a global and DOM methods operate on the current ref. Neighboring refresh functions are outside this effect and are not missing dependencies here.

Full object dependency insertion would cause extra effect executions for same-identity object replacement. Current same-feedback/busy/receipt guards generally suppress additional focus. No extra fetch, duplicate mutation, navigation loop or state-reset loop follows directly from this effect because none is performed here. The warning is current, not STALE_LINT. The current effect intentionally keys presentation receipt behavior using scalar identity/revision values while reading full-object truthiness guards. Scalar identities and the explicit receipt comment support **INTENTIONAL_STABILITY_PATTERN**; current product defect: **NONE ESTABLISHED**. Action: **ACCEPT_MONITOR**. Blind insertion of pendingScenarioResume, user and view.currentStep as complete object dependencies is not authorized. Residual uncertainty: truthiness changes without identity/revision changes (particularly malformed pending targets), and late feedback replacement during an identity transition are not exhaustively characterized by these tests. That requires a focused future test before any refactor, not blind dependency insertion.

Existing `ScenarioFinalVisualPilot.test.jsx` covers busy Confirm preventing duplicate PUT, failed save/retry, successful feedback focus/scroll and next/complete boundaries (notably lines316-375); `ScenarioExactResume.test.jsx` covers auth invalidation, locale supersession, exact-target replacement and no automatic mutations. Fresh command: `npm --prefix client test -- --watchAll=false --runInBand --runTestsByPath src/scenario/ScenarioFinalVisualPilot.test.jsx src/scenario/ScenarioExactResume.test.jsx`, CI=true: 2 suites / 121 tests PASS, exit0. Not every receipt interleaving is covered. Document the intentional pattern now; if a future scoped maintenance task aligns full-object guard reads with explicit scalar/boolean semantics, retain the receipt invariant and require identity transition tests, malformed/late receipt tests, focus/scroll verification and preservation of no-duplicate-mutation behavior. Do not add eslint-disable or alter dependencies in R4-04.

## W03: DEP0190 evidence harness

Original evidence command: `node review-evidence/r4-03a/run-safe-tests.cjs baseline` and `... post`; baseline/post harness commands exited0 and retained DEP0190 stderr. It is the parent harness (not its shell:false email-transport child) that uses `cp.spawnSync(command, argv, { shell: !isNode, ... })` at line4, with constant npm.cmd suite arguments.

To preserve all previous files, the harness and safety preload were copied byte-for-byte into `review-evidence/r4-04/`, then run as `node --trace-deprecation review-evidence/r4-04/run-safe-tests.cjs post`. Both harness hashes match. Fresh exit0; all10 existing safe suites pass. Initial stack:

```text
normalizeSpawnArguments (node:child_process:644:15)
Object.spawnSync (node:child_process:870:8)
review-evidence/r4-04/run-safe-tests.cjs:4:237
```

Exact warning: `[DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.`

[Node documents](https://nodejs.org/api/deprecations.html#DEP0190) the shell-injection hazard when args are concatenated. The observed harness receives only fixed command/suite tokens; no untrusted command input was established. First repo-location frame is untracked evidence, not product source. Tracked staging/safe-backend runners use Node executable and args without shell:true. Fresh normal `npm --prefix server run test:production-config` exits0 with empty stderr and no DEP0190. This bounds the conclusion to inspected paths; it is not a scan proving no external tool can ever emit it. Product relevance: **NONE ESTABLISHED**. Action: **NO_ACTION_TO_PRODUCT**. Future evidence harnesses SHOULD avoid passing args with shell:true, for example by invoking the Node/npm CLI entry directly. Do not rewrite preserved historical evidence or conceal the warning.

## W04: Node runtime authority debt

Local Node24.13.0; accepted staging API deployment Node24.14.1 **default**, from the Owner-supplied independent Control Tower log evidence in R4-03A persistence. This phase did not independently query Render logs or re-certify staging. No root/client/server manifest engines field, tracked .node-version or .nvmrc was found. No Render blueprint or tracked workflow supplies a pin. External override inventory was not queried; absence of a repo pin is proven, absence of every external override is not independently asserted.

[Render's official precedence](https://render.com/docs/node-version) is NODE_VERSION > repository .node-version > .nvmrc > package.json engines. Root package.json exists, so server-only engines should not be relied on to select the repo-root API build interpreter. Defaults depend on service creation date and are not a permanent project-controlled contract.

Recommended single version-selection authority: root **.node-version containing an exact reviewed supported Node24 patch**, with both Web build and API service configured to discover it, and no conflicting higher-precedence NODE_VERSION override. Do not choose a patch merely by copying either local24.13.0 or default24.14.1; a separate implementation phase should verify current supported patches/advisories. Keep an upper-bounded Node24 compatibility policy (e.g. >=24 <25) in documentation; if engines are later added as compatibility constraints, derive/check them against the one selected authority rather than maintaining a competing exact pin. Avoid floating lts, >=20, or an unconstrained latest.

Web build and API should use the same supported major and preferably the same reviewed patch to reduce drift. The browser runtime itself does not execute Node. An intentional difference must be explicit and tested. Exact patch pinning gives reproducibility; security uptake comes from scheduled/advisory-triggered, reviewed patch bumps rather than an indefinitely frozen patch or silent deployment-time changes. Check actual Web/API rootDir discovery and higher-precedence overrides at implementation; current API's previously observed rootDir was empty, Web configuration/version was not independently refreshed here.

Impact: local developers align their selected Node (file alone does not switch every local manager); Render resolves the chosen build/runtime version; bcrypt6 native prebuild/load and password operations need verification on the deployed Linux architecture; GenAI2 requires Node>=20 and Nodemailer10>=20, mysql2>=8, but declared engines do not certify AI provider behavior. OpenAI absence of a lock engine field is not unlimited support. CRA build/test and native addon smoke must pass on the chosen patch. Node24 builds already pass locally but other patches are not certified by that. Formal next corrective: **R4-04A — NODE_RUNTIME_AUTHORITY_AND_PIN_CORRECTIVE**. Severity: MEDIUM; category: OPERATIONS / REPRODUCIBILITY; action: FIX_NOW_R4, R4-04A REQUIRED. Approved design direction is root .node-version as repository-controlled Node selection authority, subject to fresh implementation-time checks for higher-precedence Render NODE_VERSION overrides. No exact patch is selected in R4-04 persistence. R4-04A must fresh-review the current supported Node24 patch and Node security state, bcrypt/native compatibility, client CRA build/tests, server tests, OpenAI/GenAI/Nodemailer/mysql2 engine compatibility and Web/API Render runtime discovery. It must occur before **R5 LIVE PROVIDER STAGING CERTIFICATION** and **Production Certification**. R4-04A requires subsequent Control Tower authorization; it is not started here. No pin or Node change now.

## W05: YAML optional-peer mismatch

Exact path: react-scripts5.0.1 > tailwindcss3.4.19 > postcss-load-config6.0.1, optional peer yaml^2.4.2. Actual resolution climbs to `client/node_modules/yaml@1.10.3`. Other mandatory parents require yaml1: cosmiconfig7.1.0 ^1.10.0, cssnano5.1.15 ^1.10.2, fork-ts-checker-webpack-plugin's cosmiconfig6 ^1.7.2. The lock hoists yaml1 and records no nested yaml2 for this optional peer. This explains observed resolution, not the undocumented original resolver's reasoning/history.

Current `npm --prefix client ls yaml postcss-load-config --all --json` exit1: invalid yaml1 for the optional yaml2 peer. A fresh isolated copy of exactly the client manifest/lock ran `npm ci --ignore-scripts --no-audit --no-fund`: exit0,1414 packages installed. Copied manifest/lock SHA256 remain identical. Isolated npm ls also exit1 / ELSPROBLEMS with the same mismatch. Thus this is **not LOCAL_INSTALL_ONLY** and not caused by this phase's canonical tree; it is a reproducible invalid graph. No canonical install occurred. The isolated copy remains under evidence and was not cleaned.

Postcss-load-config loads yaml dynamically only for YAML config files and calls yaml.parse at src/index.js:89. A safe evidence-only `.postcssrc.yaml` with `plugins: []` produced **TypeError: yaml.parse is not a function**. This is a demonstrated dormant config-loader defect, not merely cosmetic npm ls noise. Initial probe accidentally requested the unexported yaml/package.json subpath; that diagnostic API error was corrected to public yaml entry resolution before the actual loader was tested, and is not evidence of the loader defect.

Current CRA webpack uses explicit postcssOptions with config:false; client/tailwind.config.js is absent, and no tracked PostCSS YAML configuration was found. Thus this postcss-load-config YAML route is not used in the inspected current Cyberly build. YAML1 is used elsewhere by legacy config/minifier tooling, so "optional unused" applies to **this peer consumer**, not to all yaml use. Fresh build exit0 and two Scenario suites pass despite mismatch. Final classification: **REAL LATENT BUILD / REPRODUCIBILITY DEFECT**. Current runtime blocker: **NO**. R5 planning/mocked blocker: **NO**. Action: **PRODUCTION_GATE_ITEM**, not FIX_NOW_R4. Before Production Certification it must either (A) be resolved through a separately tested compatible dependency resolution, or (B) be explicitly governed with documented non-use, reproducibility evidence and accepted residual risk. Any proposal to enable this YAML loader path requires separate risk review. Do not blindly replace all yaml1 users with yaml2, add direct yaml/override, or mutate the current lock to silence diagnostics.

## W06: root concurrently setup

Root devDependency concurrently^10.0.3 is declared/locked; root node_modules absent; require.resolve('concurrently') fails MODULE_NOT_FOUND; root `npm ls concurrently --depth=0 --json` exit1. Root dev script uses concurrently to run dev:server/dev:client together. This is an actual local setup incompleteness for the documented one-command dev workflow, not a defect in current server/client sources. Individual prefix commands do not need root concurrently; root build successfully delegates to client without it. Static Web and API prefix deployment commands do not require it, so **LOCAL_SETUP_DEBT / PRODUCTION_IRRELEVANT**, not BUILD_BLOCKER.

Absence is consistent with the reported recovery/deletion context and was already present at R4-03, but the causal claim "root install was never restored after deletion" is not independently proven by current files. No deletion/cleanup or root install was attempted here. Action: ACCEPT_MONITOR. No tracked corrective is required merely because canonical root node_modules is absent. If one-command npm run dev is required later, perform a separately authorized local setup restoration, with the R4-03 concurrently security finding reviewed; no need to touch this merely for R5 mocked provider work.

## W07: CRA lifecycle

react-scripts5.0.1 supplies client start/dev server, webpack production build, Jest test and eject. Accepted deployment is static React output with a separate Express API, not a public CRA dev server. [React deprecated CRA for new applications](https://react.dev/blog/2025/02/14/sunsetting-create-react-app); accepted R4-03 records extensive tooling debt. This phase did not reopen audit counts or use audit fix.

Fresh compile and focused tests pass on Node24.13.0. No framework migration prerequisite is established for R5 planning/mocked work or Capstone delivery. Production Certification requires a specific, reviewed build/toolchain risk treatment and reproducible supported runtime; current evidence does not prove that framework migration itself is mandatory. Keep dev/test tools off public runtime and avoid untrusted build/config inputs. Defer a high-level build-tool/framework migration category to R8, or Post-Capstone by Owner / Control Tower decision. Do not begin Vite/Next design or broad SDK/React upgrades here. Reprioritize only if new material build, support or reachable-security evidence changes the accepted classification.

## W08: additional observed warning

Fresh build also reports `Line 42:8: 'CompactHeader' is defined but never used (no-unused-vars)` in App.jsx. It is a source-maintenance warning, not an observed learner behavior failure. It is disclosed alongside W01-W07 rather than silently suppressed; no import removal or general lint cleanup is authorized. Action: ACCEPT_MONITOR; severity LOW; category BUILD / SOURCE MAINTENANCE. It may be removed opportunistically only within a future approved source-maintenance change where regression scope is already open.

## Decision questions and sequence

A. Actual defects: W06 missing local setup; W05 invalid peer graph and latent YAML-loader failure. W04 is operational reproducibility/governance debt. No present Scenario receipt behavior defect was demonstrated.

B. Warning-only without observed current product defect: W01, W02, W03 and additional W08; W05 is not purely warning-only because its dormant loader was reproduced failing. W07 is broader maintenance debt.

C. Safe before R5 with scoped approval: W04 pin/governance (MEDIUM regression scope); W06 bounded setup restoration when needed; W05 compatible isolated resolution; W03 future evidence-runner changes are LOW product impact. "Safe" is conditional on targeted validation and explicit phase authority, not authorization from this document.

D. Do not touch broad CRA/framework migration, AI SDK majors, React/toolchain wholesale upgrades or Scenario behavior simply for lint before Capstone. R8/Post-Capstone migration remains deferred.

E. R5 planning/mocked provider work blocker: NO, none of W01-W07 inherently prevents it.

F. Eventual live-provider staging certification: W04 pin/governance must be resolved; accepted default24.14.1 is current evidence, not a durable future build/runtime authority. Other items require reevaluation if a live gate uses the affected tooling/config paths; none grants live-call approval.

G. Production Certification: R4-04A must establish Node authority/pin governance; W05 is a PRODUCTION_GATE_ITEM requiring separately tested compatible resolution OR documented non-use, reproducibility evidence and accepted residual risk; W07 build-chain risks need formal disposition. No automatic CRA migration mandate or universal current runtime blocker is claimed.

H. Node pinning must be addressed by separately authorized R4-04A before R5 LIVE PROVIDER STAGING CERTIFICATION and Production Certification; no exact patch selection or pin now.

I. Scenario useEffect should be documented now as an intentional scalar-identity receipt pattern, not blindly "fixed". A future dependency/read alignment task may reduce lint while preserving semantics, only after identity transition and malformed/late receipt tests, focus/scroll verification and preservation of no-duplicate-mutation behavior.

Recommended sequence: characterization review accepted; subsequently authorize R4-04A Node runtime authority/pin corrective; dispose W05 by compatible resolution OR explicitly governed residual risk before Production Certification; restore local setup only when separately needed/authorized; retain Scenario presentation receipt semantics; monitor warnings within the approved Node24 boundary and defer CRA migration to R8/Post-Capstone. No R4-04A implementation, remediation, R4-05 or R5 execution is started by this artifact.

## Evidence, verification and limits

Raw evidence: `review-evidence/r4-04/` contains build trace/result, byte-identical harness reproduction/result, safe-suite outputs, direct normal npm output, Scenario121-test result/stdout/stderr, current/isolated YAML graphs and hashes, isolated ci output, YAML parents/config probe, root concurrently result and old-evidence hash inventory. The isolated node_modules and build outputs are ignored diagnostics, not deliverables or deployment artifacts.

Fresh build was a compilation diagnostic using the exact known command; no production API-base override was supplied and no client .env file exists beyond .env.example. Therefore compilation PASS is not deployment/runtime configuration certification, and the local output must not be deployed. No deploy occurred.

Scenario test stderr retains two jsdom XMLHttpRequest AggregateError entries; test exit0. The test API default is localhost:5000, configured REACT_APP overrides were absent, scenario mutation APIs were mocked. These are test-network noise, not a demonstrated live SMTP/AI provider call; no provider execution was run. Existing safe-backend AI_TEST_ERROR sentinel remains non-failing evidence. No warnings were suppressed or source tests changed.

Limits: no real browser verification, no new DB/TLS/provider integration, no Node-major upgrade test, no fresh live Render configuration inspection, no complete all-interleaving proof of W02, no original npm resolver-history proof, no root restoration-history proof. Isolated ci used ignore-scripts and npm11.6.2/localNode24.13.0; it does not certify every platform or a different npm release. Do not infer public/production readiness from passing diagnostic commands.

Characterization boundary: no runtime source, manifest or lockfile changes, canonical dependency installation, deployment, Node pin/change, DB mutation, migration or live provider call. R4-03/R4-03A/R4-04 raw evidence remains untracked and preserved. Documentation-only persistence follows separate Owner / Control Tower authorization and does not authorize any debt remediation. Gate recommendation after persistence: **R4-04_PERSISTED_READY_FOR_FINAL_CONTROL_TOWER_VERIFICATION**; R4-04 is not self-closed.

## R4-04A Node Runtime Authority Candidate

Date checked: 2026-10-05. Base HEAD: `a091a635e5b305c2622fb339e587ae85207cf354`. **R4-04A Node Runtime Authority Candidate was independently reviewed and accepted by Control Tower on 2026-10-05.** Repository authority: root `.node-version` = `24.21.0`. Local/isolated compatibility validation: **PASS**. Persistence of this authority does not mean staging has already adopted it. R4-04A remains pending final persistence verification until the reviewed files are committed and confirmed on origin/develop; final closure remains with Control Tower.

**NODE24_CURRENT_AUTHORITY = `24.21.0`**, selected after fresh [official Node24 archive](https://nodejs.org/en/download/archive/v24), [24.21.0 LTS release](https://nodejs.org/en/blog/release/v24.21.0) and [security notices](https://nodejs.org/en/blog/vulnerability) review. The latest listed Node24 remains 24.21.0; no newer listed supported Node24 release or current notice requiring avoidance was found. The July security release is 24.18.1, preceding this candidate. This is an exact supported Node24 LTS maintenance update within the approved major line, not a claim that Node24 has entered the lifecycle phase named Maintenance LTS. Recheck official releases/security before each later patch update; no automatic floating latest or indefinite security freeze. **NODE25_PLUS = SEPARATE_COMPATIBILITY_GATE_REQUIRED** (W01).

Root `.node-version` contains only `24.21.0` and a newline, the single exact repository version-selection authority. No `.nvmrc`, engines pin or Render NODE_VERSION was added. Fresh read-only service metadata confirms Web `srv-d9tj5hu5djic73a0auk0` and API `srv-d9tiop942hec738b3org` both have empty rootDir (repository root), with the previously accepted prefix client/server commands and autoDeploy off. Exact-key GETs found no direct NODE_VERSION (404); the workspace environment-group response is an actual empty array (Count=0), so no inherited group override was found. Inspection outputs contain no unrelated environment values or credentials. [Render precedence](https://render.com/docs/node-version): NODE_VERSION > root .node-version > .nvmrc > engines.

Current accepted R3 staging still uses **Node24.14.1 Render default**, per Owner/Control Tower accepted authority; this task does not change staging. No deployment or Render mutation occurred. Root positioning provides discovery eligibility for both future builds, not proof of actual Render use. The next separately authorized staging deployment must verify: Web build logs select Node24.21.0; API build logs select Node24.21.0; API runtime uses Node24.21.0; no higher-precedence Render NODE_VERSION supersedes the repository authority; and health/smoke acceptance passes. R5 live runtime is not authorized by this persistence. This remains required before R5 live-provider staging certification and Production Certification.

Validation uses an official portable Windows x64 Node24.21.0 installation outside the repository; HTTPS SHA256 matches official SHASUMS (`158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541`), with no independent GPG signature verification. Existing system Node24.13.0 is unchanged. A new git-archive isolated copy of the exact base SHA plus the pin is retained under untracked `review-evidence/r4-04a/isolated-candidate`; prior evidence is preserved. Normal trusted lifecycle scripts are enabled for clean client/server npm ci, including native bcrypt. Package/lock SHA256 comparisons confirm no install mutations. Safe tests sanitize provider/DB/SMTP configuration, suppress local dotenv ingestion and block external/SMTP/DB sockets; no TEST_DB configuration is supplied.

Validation results: production build PASS (exit0); full client regression PASS (exit0), **118 suites / 1412 tests**, 594.536 seconds, matching the R3 historical counts; final results and exact commands are retained in `review-evidence/r4-04a/validation-results.json` and per-command logs. Server npm ls --all passes; production audit reports 0 vulnerabilities; bcrypt load and local hash/compare pass; all ten safe server invocations pass (email transport, reset email, email change foundation/request/confirm, guardian link, production configuration, security boundary, database TLS and npm test safe-backend). Real migration/DB branches are not run. Known client W05 peer inspection remains invalid (exit1), while the actual production build passes. W01 DEP0176, W02 Scenario exhaustive-deps and W08 unused CompactHeader warnings remain governed by R4-04. SDK engine inspection and local loads for mysql2, Nodemailer, OpenAI and GenAI pass without provider initialization; locales verification passes. The build uses no production API-base env configuration and is compilation evidence, not deployable runtime certification. No runtime source, tests, packages, lockfiles, env or migration files are changed.

Exact selected-runtime invocations use the portable `node.exe` and bundled `npm-cli.js` without shell:true: `node --version` (v24.21.0); `npm --version` (11.19.0); `npm --prefix server ci --no-audit --no-fund`; `npm --prefix client ci --no-audit --no-fund`; `npm --prefix server ls --all`; `npm --prefix server audit --omit=dev --json`; the ten server commands listed in validation-results; `npm --prefix client run build` (CI=false, keeping known warnings nonfatal); `npm --prefix client test -- --watchAll=false --runInBand` (CI=true); `npm --prefix client ls yaml postcss-load-config --all --json` (known W05 exit1); local bcrypt hash/compare, SDK imports and `node scripts/verify-locales.js`. Test output includes existing nonfailing console diagnostics; exit status and complete suite counts establish the test outcome. No manual browser verification is required for this config-only local phase; real browser/runtime and exact Node discovery checks belong to the next authorized staging acceptance.

## R4-06 W04 Staging Verification Closure Note

2026-10-05 / Control Tower accepted R4-06 runtime integration with an accepted scope limitation. **R4-04-W04 — Node runtime authority debt: REMEDIATED / STAGING VERIFIED BY R4-04A + R4-06.** Repository pin: root .node-version = **24.21.0**. Render Web build: **24.21.0 VERIFIED** (dep-db1kkcegekts73e9r6ug). Render API build/runtime: **24.21.0 VERIFIED** (dep-db1kimdg1s2s73akmku0; runtime v24.21.0). Both exact accepted runtime deploys point to **91a052736dda7d37c05ac315e9738b4c29937622**.

This dated note supersedes historical statements that staging Node adoption was pending; W01–W08 characterization and the R4-04A local evidence above remain historical records. **NODE25_PLUS = SEPARATE_COMPATIBILITY_GATE_REQUIRED** remains unchanged. W05 production Gate, W07 CRA debt and all other accepted debt classifications are unchanged. This note does not certify live providers or production and does not self-declare final R4 closure.
