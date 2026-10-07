# CyberGuard Controlled Agentic Live R5-10 design

**Status: CONTROL TOWER WORKING DESIGN / OWNER ROUTINE EXECUTION AUTHORITY**

## Scope and authority

Exact product baseline: `cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688`.
Parent pre-corrective baseline: `09649868238ba4801fb0ffea31a51026b8cc582e`.
This phase authorizes only harness/tests/docs preparation and offline verification.
No commit, push, deploy, live Provider request, staging database access, production
access, live gate execution, branch operation, environment-file change, or evidence
cleanup is authorized. Product runtime source stays unchanged. R5-05 through R5-08
are owner-supplied certified states; R5-09 is TOOL_NORMALIZATION_PASS / OFFLINE
CONTRACT. Neither CONTROLLED_AGENTIC_LIVE_PASS nor production readiness is certified.

Successful offline harness preparation does NOT authorize or establish the future
live result. The eventual one-off execution must be separately adjudicated from
Render logs/receipts and the exact deployed candidate. Public Web, master, tags,
production, historical review-evidence and unrelated untracked files remain untouched.

## Resolved R5-10A product corrective

**Both prior product blockers: RESOLVED by
`cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688`. Future live readiness: PENDING
Control Tower harness reacceptance, persistence, exact staging deploy/inert
verification, then separately authorized bounded live execution.**

The accepted R5-10A corrective changed only the two runtime files below and their
two regression tests. The owner reports independent Control Tower test acceptance;
read-only comparison of the exact parent and corrective Git blobs confirms:

1. Audit metadata blocker resolved: `server/src/ai/ai.service.js` now spreads
   `...result` from `planAndExecute` into the returned object before normalizing
   `contextText` and `actionProposal`. The full planner result is preserved,
   including eligibility/use, planner Provider/model, proposed tool/status and
   model/tool counters consumed by `buildAgenticAudit`.
2. Five-tool suppression blocker resolved: `server/src/agent/agentModelGateway.js`
   now always supplies `listControlledToolDeclarations()`, the five controlled
   tools, even when `context.preferActionProposal === true`. Trusted target context
   no longer suppresses the planner tool declarations.

This offline rebase changes no product runtime or product regression test. All 26
SOURCE_HASHES are recomputed from exact corrective Git blobs with CRLF -> LF only;
only `ai.service.js` and `agentModelGateway.js` differ from the parent map. Strict
trace, five-tool wire request and all live bounds remain intact. Do not patch audit
results inside the harness, override planner context, or hide/remove staging content.
Resolution of these two blockers does not establish CONTROLLED_AGENTIC_LIVE_PASS
or verify actual staging data, deployment, persistence or live Provider behavior.

## Future scenario and process boundary

Fixed public prompt:
`Can you check my current learning progress and tell me which topic I should improve next? Please use my progress.`

The future path is real OpenAI planner -> canonical normalization -> exactly one
`get_learning_progress` backend tool -> final CyberGuard generation. Tools must
remain `read_only` with `allowedRoles` including `user`. No action proposal is
allowed. Exactly one planner and one final logical request, at most two physical
attempts, zero retries, zero Provider fallback. Success requires exactly two
physical responses and one successful tool execution.

Default invocation prints NOT_AUTHORIZED with zero Provider/tool/DB/network counters
and imports no app, database or Provider modules. `--self-test` uses pure synthetic
fixtures only; it imports no product modules and opens no socket. Mixed/unknown
execution arguments fail closed. Live execution requires separate exact interlocks:

- `R510_OWNER_AUTHORIZED=cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688`
- `R510_BUDGET_USD=0.02`
- `RENDER_SERVICE_ID=srv-d9tiop942hec738b3org` (existing R5 API service identity)
- `R510_DEPLOY_COMMIT`: full 40-character deployed candidate, exactly `RENDER_GIT_COMMIT`
- `R510_HARNESS_SHA256`: exact raw-byte hash of the deployed harness
- `NODE_ENV=production`
- inherited public Live and Agentic flags both differ from `1`; no inherited `AI_TEST_*` key, including empty values

The script locates the repository relative to itself; it accepts no arbitrary root
override. Critical source hashes bind the product baseline before any product import.
Source hashes normalize CRLF to LF only, matching Git blobs across Windows/Render;
the harness self-hash is raw bytes and must be measured on the deployed candidate.
The 26-entry hash map covers the required AI service/config/registry/OpenAI/tools/gateway/
controlled service/executor/catalogue/database/server files plus supporting runtime
and audit modules. Tests compare each hash with both the baseline Git blob and checkout.

After guards, only the job process sets Live/Agentic to `1`, all Provider assignments
to OpenAI, model to `gpt-5.4-mini`, final output to 400, and email transport disabled.
No public service configuration is modified. A fixed `127.0.0.1:51237` API listener
is created in the job. No registration/email workflow is used for synthetic setup.

## Transport, normalization and execution

Patch OpenAI creation before registry/server load; assert `config.maxRetries=0`,
exact model, and absence of mock mode. Supply the guarded fetch explicitly to the
SDK and globally. Count planner calls at `provider.generate` with
`metadata.purpose='agent_route_planning'`; count final calls at `generateReply`.
Its closure-internal `generate` is not an additional logical request. A sticky stop
blocks subsequent Provider/tool activity even if product fallback catches an error.

Only exact `https://api.openai.com/v1/responses` POST and the fixed loopback API
origin are allowed by fetch. Credentials in URL, query/fragment, other ports,
destinations, redirects and streaming are blocked. Requests are at most 20,000 UTF-8
bytes. Both use exact model and `store=false`. Planner max output stays 500;
instruction identifies the Controlled Agentic planner. Its flat Responses function
declarations are exactly the five existing controlled names, with no internal
risk/mode/role metadata. Final max output is at most 400, no tools, tool-result
instruction present, and original prompt present as a user model input.

Clone each native response for metadata/usage accounting, retain only safe numeric
usage and fixed validated status/model. Never log output. Both responses require
positive integer input/output usage. Standard uncached accepted R5 estimate uses
US$0.75 input and US$4.50 output per million tokens, accumulating BOTH physical
responses. Missing/invalid usage, excess output or total estimate > US$0.02 stops
without another attempt. Unknown/failed usage is unknown, not free. This is an
estimated cost ceiling and post-response stop, not an invoice or Provider-side hard
spending cap; an already-returned response cannot be unbilled. No price research
or Provider discovery is required in this offline phase.

Before the gateway consumes the planner result, require exactly one canonical call:
nonempty `callId`, `toolName=get_learning_progress`, plain-object arguments without
`userId`, Provider `openai`, no action proposal. Patch executor creation before
controlled service/server load. Reject a second execution and wrong name/identity
arguments before invoking the original executor; require `status=success`. Receipts
contain no result payload, raw prompts other than the fixed public prompt, output
text, sources, credentials, email, password, headers or arbitrary exception messages.

## Future data and product assertions

After health 200 and guarded startup, directly insert a new verified active 16-year-old
synthetic user, random `example.invalid` email and random password hashed with bcrypt.
Never print/email credentials. Seed one progress summary and one topic row before
generation (beginner, 35% phishing progress). No assessment fabrication is needed.
Login via product API and create one conversation with the fixed prompt.

After setup/login and before generation, snapshot every column of learner profiles,
progress summary/topic rows, recommendations, assessment attempts/answers/topic
scores and scenario attempts/decisions/progress events, filtered to the synthetic
user. Child rows use joins through owned attempts. Snapshots stay in memory only.
Require equality after tool/final and after replay, including empty row sets.
Preserve synthetic data on success or failure; never delete it or run migrations.

POST generation must return 201, completed generation, nonempty assistant and null
proposal. Persisted final usage must be positive. Transport counters must be 2/2,
planner/final 1/1, tool 1, positive transport tokens and total estimate <=0.02.
Persisted trace must have controlledAgenticEligible=true, planning.used=true,
planning.provider=openai, decision=request_tool, fallbackReason=null,
toolExecution.toolName=get_learning_progress, status=success, readOnly=true, and
limits maxModelCalls=2, maxToolExecutions=1, modelRequestCount=1, toolExecutionCount=1.

Completed-generation replay must return 200 with identical assistant/generation/
action/source IDs; chat messages, generations, actions and sources row counts stay
unchanged, as do Provider/tool counters and learning snapshots. Proposals
use the existing in-memory store; the harness blocks its `set()` method and requires
zero proposal attempts rather than querying a nonexistent SQL table. The
existing replay audit behavior remains: `ai.service` starts a fresh audit
trace before checking completed-generation replay. Audit trace writes are permitted
by this task; their measured increase is recorded separately. Do not assert all
database tables are write-free on replay or remove that product behavior in this
phase. Health must remain 200 afterward. This is separate from the persisted R5-08
read-only audit limitation: the independent second DB re-query was not completed
because transparent Render CLI commands failed locally before job creation. That
historical limitation is preserved and is not resolved by this offline phase.

## Offline verification and review

Only the two named docs, harness, harness test and one package script change.
Tests first: inert child process and self-test child process, both with product-import
tripwires and a no-network firewall. Static/read-only checks prove exact constants,
safe errors, source map against baseline, reviewable plain JS and no credential
printing patterns. Self-test exercises good/bad planner/final requests, call/tool
caps, destination, budget, normalized calls, missing context, replay and sticky stop.
Regression commands use the same process-local firewall preload without writing
to historical evidence. Network guards are JavaScript transport tripwires, not an OS
firewall or proof of live staging behavior.

Run the requested dedicated suite, CyberGuard live activation regression, tool
normalization, controlled Agentic, Provider unit suite, both JS syntax checks and
`git diff --check`, with empty Provider credentials and the process-local no-network
guard for every regression. No database-dependent suite,
migration, ingestion, server startup, live gate or frontend build is needed here.
Manual browser verification is not needed for this offline backend harness phase.
Control Tower independently reaccepts the rebased offline harness first, followed
by persistence and exact staging deploy/inert verification before bounded live
execution. Future live authority and exact deployed-candidate adjudication remain
separate. Passing offline tests prove the harness guards and corrective fixture
behavior; they do not establish the requested live success predicates.
