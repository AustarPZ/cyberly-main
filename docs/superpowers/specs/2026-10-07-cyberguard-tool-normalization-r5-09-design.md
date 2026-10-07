# CyberGuard Tool Normalization Acceptance R5-09

**Status: CONTROL TOWER ACCEPTED / OWNER ROUTINE EXECUTION AUTHORITY**

## Authority and scope

Exact baseline: `b487aac6720481b0421f1179d57492a8e5efe3eb`. Owner authorizes the supplied bounded local/offline implementation and tests. Control Tower independently verified the provider wire contracts and captured the two baseline REDs supplied in the task; this executor relies on that supplied evidence without browsing or contacting providers.

R5-09 certifies deterministic wire/canonical normalization only. It does not certify live provider tool calling, Controlled Agentic live behavior, tool execution correctness against real provider output, or production readiness. Independent Control Tower offline acceptance remains pending.

No commit/push, deployment, Render mutation, live provider call, staging DB or production access, Controlled Agentic live certification, reset/stash/clean/branch switch, or changes to local environment files. Preserve review-evidence and unrelated untracked files. No schema, learner API, UI, catalogue policy, eligibility or executor changes.

## Verified baseline and root causes

- Shared `normalizeReturnedToolCalls` chooses `id` without considering `call_id`, leaves JSON arguments as strings, and does not trim returned names.
- `toOpenAiTools` correctly emits flat Responses declarations; `toGeminiTools` correctly emits `functionDeclarations` with `parametersJsonSchema`. Both use shared declaration validation and exclude internal metadata.
- ILMU posts to `/chat/completions` but uses the Responses serializer. Its extractor parses argument text locally and catches invalid JSON as `{}`, defeating fail-closed shared validation.
- OpenAI already passes raw Responses function-call items to shared normalization. No OpenAI or Gemini adapter change is required for the supplied contract.
- Inherited boundary: Gemini's existing extractor uses `functionCall.args || {}`. Malformed direct falsy SDK values could become `{}` before shared validation. This phase covers valid structured Gemini args and shared-normalizer rejection fixtures; it does not certify end-to-end rejection of every malformed SDK value. No test proved an unavoidable defect against the supplied valid wire contract, so the adapter stop condition was not triggered.

## Canonical returned contract

The exact shape remains `{callId, toolName, arguments, provider}`. Use the first nonempty ID in `call.callId`, `call.call_id`, `call.id`, then `${provider}-tool-call-${index + 1}` using the original returned-list index. Trim names from `toolName`, `name` or `function.name`; exclude empty/prohibited names before argument processing. Keep the prohibited-name set unchanged.

Choose the first defined argument field from `arguments`, `args`, then `function.arguments`; only absent fields default to `{}`. An explicit invalid value must not fall through to another field. Blank JSON text becomes `{}`. Nonblank JSON must parse to a plain object. Reject malformed JSON, arrays, numbers, booleans, strings, null, and nonplain direct values. Accept ordinary objects and objects with a null prototype without copying or mutating their contents, including nested arrays and primitives.

Throw the existing `AI_TOOL_CALL_INVALID` provider error with a fixed message that contains no argument payload. One malformed allowed call rejects the entire normalization result; no valid prefix is returned. Normalization performs no tool execution.

## Outbound contract and ILMU integration

- Responses: retain `toOpenAiTools(tools)` producing `{type:'function', name, description, parameters}`.
- Chat Completions: add `toChatCompletionsTools(tools)` producing `{type:'function', function:{name, description, parameters}}`.
- Gemini: retain `toGeminiTools(tools)` producing `[{functionDeclarations:[{name, description, parametersJsonSchema}]}]`.
- Each serializer uses `normalizeToolDeclarations`; prohibited declarations throw before serialization. Only explicit wire fields are emitted, excluding `riskLevel`, `mode` and `allowedRoles`.
- ILMU uses the new serializer and passes raw `message.tool_calls` to shared normalization. Preserve endpoint, messages, model, retry/timeout, auth, usage and existing error wrapping.

## Files and verification

Only the requested design, plan, dedicated test, server package script, shared tools module and ILMU adapter change. If an unavoidable OpenAI/Gemini adapter defect is proved, stop and report instead of expanding.

Write the dedicated tests and package command first; run RED before either production module changes. Cover the supplied ID, names, JSON/object validation, prohibited names, exact serializer shapes/metadata, and injected ILMU transport cases. Add ILMU malformed-response tests to prove its extractor no longer masks failure. All fixtures are synthetic and transport is injected. Deny real transports before loading production modules.

Run `npm.cmd --prefix server run test:ai-tool-normalization`, `npm.cmd --prefix server run test:ai-provider-unit`, `npm.cmd --prefix server run test:controlled-agentic`, `node --check` on each changed/new JS file, and `git diff --check`. Existing regression suites use a process-local transport tripwire. Controlled Agentic regression uses injected fixture handlers only; there is no real tool or provider execution. Do not run DB-dependent or live suites, migrations, ingestion, server startup or frontend build. No manual browser check is needed for this backend wire-only phase. Record RED/GREEN and command results in the plan.
