# CyberGuard Public Beta Pilot Specification

**Status:** Approved pilot specification for Cyberly Public Beta 0.9
**Implementation status:** Implemented through the CyberGuard Public Beta 0.9 pilot tasks; final certification evidence is recorded in this document.
**Pilot surface:** CyberGuard full-page chat and floating companion widget

## A. Purpose

CyberGuard is the first Public Beta 0.9 product-experience pilot. It combines companion identity, AI transparency, chat readability, sources, actions, proposals, multilingual content, responsive behaviour, loading, error, and accessibility states.

## B. Verified Pre-Pilot Problems

Verified pre-pilot facts from the static and runtime audits:

- The previous full-page CyberGuard hero pushed the conversation and composer below the first screen at several common viewports.
- The previous large dark-gradient hero was not the right pattern for a task workspace.
- The previous hero included outdated "AI Gateway phase" wording.
- The previous empty-state wording "Ask CyberGuard anything" was too broad for a bounded cyber-wellness assistant.
- No sufficiently visible AI-may-make-mistakes notice was verified before the pilot.
- Current provider reliability and prompt-tolerance issues exist, but they are backend/AI work outside this frontend pilot.
- Drawer Escape and focus-return behaviour should be retained.
- `role="log"`, `aria-live`, Markdown rendering, compact source expansion, and source/proposal/action ordering should be retained.

## C. Pilot Goals

- Make CyberGuard feel like a supportive cyber-wellness learning companion.
- Make the conversation and composer visible in the first screen.
- Provide clear AI transparency without overwhelming the learner.
- Improve first-use guidance with four useful quick prompts.
- Keep sources, proposals, and follow-up actions distinct.
- Preserve current backend contracts and safety boundaries.

## D. In Scope

- Full-page CyberGuard layout and visual hierarchy.
- Compact CyberGuard workspace header.
- AI transparency notice.
- First-use empty state.
- Chat-shell height and scrolling model.
- Desktop history sidebar and mobile drawer refinement.
- Message hierarchy and readability.
- Source, proposal, and action visual hierarchy.
- Floating widget as a lightweight companion preview.
- Initial tokens and component extraction needed for the pilot.

## E. Out of Scope

- Backend provider reliability fixes.
- Prompt tolerance or scope-classifier changes.
- API contract changes.
- Database changes.
- Full App.jsx rewrite.
- New AI provider behaviour.
- New Agentic action types.
- Admin UI redesign.
- Full design-system migration across the whole application.

## F. Approved Page Structure

The full-page CyberGuard route should use:

1. Compact workspace header.
2. AI transparency notice.
3. Conversation workspace with history and active chat.
4. Composer anchored to the active chat workflow.

The page should not use a large hero that pushes the task below the first screen.

## G. Compact CyberGuard Workspace Header

Replace the large dark-gradient hero with a compact header that includes:

- CyberGuard name.
- Short purpose statement.
- Current state or selected conversation title.
- Optional compact secondary action such as new chat.

Remove or replace outdated AI Gateway phase wording.

## H. AI Transparency Notice

Add a compact persistent notice that communicates:

- CyberGuard is AI-supported.
- AI can make mistakes.
- Learners should use reviewed sources and trusted adults for serious concerns.
- CyberGuard is for cyber-wellness learning, not emergency or legal advice.

The notice should be visible but not dominant.

## I. First-Use Empty State

Replace "Ask CyberGuard anything" with bounded guidance. The empty state should:

- Explain that CyberGuard helps with cyber wellness learning.
- Offer four quick prompts.
- Encourage the learner to ask about scams, passwords, privacy, misinformation, online safety, or next learning steps.

Quick prompts should fill the composer before sending so the learner stays in control.

## J. Chat-Shell Height Model

The chat shell should account for the actual viewport, navigation, compact header, transparency notice, and footer. The conversation and composer should be visible in the first screen at common desktop and mobile sizes.

Avoid fixed-height assumptions that push the composer below the viewport.

## K. Scrolling Model

Use the message list as the primary scroll region once the chat workspace is in view. Avoid forcing the learner to scroll the whole page just to reach the composer.

For long responses, prefer showing the beginning of the assistant answer after generation rather than only the bottom action cards.

## L. Desktop Sidebar and Mobile Drawer

Retain:

- Desktop conversation history.
- Mobile drawer pattern.
- Escape-to-close.
- Focus return to the drawer trigger.

Refine only where needed for spacing, copy, and visual hierarchy.

## M. Message Hierarchy

Message order remains:

1. User message or CyberGuard Markdown answer.
2. Compact reviewed sources.
3. Learner-controlled proposal, if present.
4. Follow-up action cards.

AI answer text should remain the primary content. Sources should be evidence. Action cards should be next-step affordances. Proposals should be explicit confirmation surfaces.

## N. Source, Follow-Up Action, and Proposal Hierarchy

Retain compact source expansion and source/proposal/action ordering.

Source summaries should be visually secondary. Follow-up actions should be clear but not dominate the answer. Proposal cards should clearly state that nothing happens until the learner confirms.

## O. Floating Widget Positioning

The floating widget should become a lightweight companion preview:

- Compact header.
- Short recent context or starter prompt.
- Composer available when authenticated.
- Link to full CyberGuard page.

It should not try to show the entire long conversation at once on small screens.

## P. Initial Token Set

Initial pilot tokens:

- Cyber Indigo.
- Digital Mint.
- Explorer Coral.
- Achievement Gold.
- Neutral page surface.
- Raised panel surface.
- Muted text.
- Focus ring.
- Chat bubble radius.
- Workspace gutter.
- Message width.
- Drawer width.

Token values are approved initial design direction, subject to visual prototype validation.

## Q. Initial Primitive, Shared, and Domain Component Set

Primitive:

- Button.
- IconButton.
- Badge.
- TextInput/Textarea.
- Surface.

Shared:

- WorkspaceHeader.
- AIContentNotice.
- Drawer.
- Dialog.
- EmptyState.
- LoadingState.
- ErrorState.

CyberGuard domain:

- ChatShell.
- ConversationList.
- ChatMessage.
- ChatComposer.
- QuickPrompt.
- SourceSummary.
- ActionCard.
- ProposalCard.

## R. Gradual App.jsx Extraction Strategy

Do not rewrite the full file in one pass. Extract only stable pieces:

1. Tokens and small primitives.
2. CyberGuard-only shared components.
3. Conversation/history layout pieces.
4. Message, source, action, and proposal components.

Each extraction should preserve behaviour and include verification evidence.

## S. Accessibility Requirements

- Preserve `role="log"` and `aria-live`.
- Preserve drawer focus return.
- Keep visible focus states.
- Keep source toggles keyboard accessible.
- Keep proposal confirmation explicit.
- Ensure no important information depends on colour, motion, or sound alone.
- Support reduced motion.
- Verify 320 CSS px reflow and 200% zoom.

## T. Multilingual Requirements

The pilot must support English, Bahasa Melayu, and Simplified Chinese. Future Tamil support must not be blocked by fixed widths or typography choices.

All new learner-facing text must use i18n. Long Malay labels and Chinese text must wrap without horizontal overflow.

## U. Acceptance Criteria

- Large dark-gradient hero removed or reduced.
- Outdated AI Gateway phase wording replaced.
- Conversation and composer visible in the first screen at audited target viewports.
- Compact AI-may-make-mistakes notice visible.
- Empty state no longer says "Ask CyberGuard anything."
- Four quick prompts fill the composer before sending.
- Drawer Escape and focus return still work.
- `role="log"` and `aria-live` still exist.
- Markdown rendering still works.
- Compact source expansion still works.
- Source/proposal/action ordering remains unchanged.
- Floating widget remains compact and usable on mobile.
- No API contract, database, provider, or safety-boundary change.
- No full App.jsx rewrite.

## V. Backend/API Boundaries

The frontend pilot must preserve existing API contracts. Provider reliability, prompt tolerance, RAG retrieval, action generation, and proposal execution are separate work packages.

Do not create frontend-only behaviour that claims a backend action occurred.

## W. Risks and Deferred Work

Risks:

- Provider failures may limit runtime acceptance.
- Existing long conversations may still stress compact widget layout.
- Large App.jsx structure may slow extraction.
- Future Tamil support requires later typography and copy validation.

Deferred work:

- Backend prompt-tolerance improvements.
- Provider reliability.
- Full component-system rollout.
- Sound design.
- Full public-beta visual refresh across all pages.

## X. Implementation-Planning Status

The scoped implementation plan for the CyberGuard pilot has been created and executed through Tasks 1-8. Future CyberGuard Public Beta 0.9 changes must follow the freeze policy below rather than reopening the broad pilot implementation plan.

## Y. Final Pilot Handoff and Verification

**Product name and version:** CyberGuard Public Beta 0.9.

**Evidence date:** July 28, 2026.

**Product positioning:** CyberGuard is the AI-supported cyber-wellness companion inside Cyberly. For the pilot, it is designed as a learner-controlled chat workspace that helps Malaysian teenagers ask focused cyber-wellness questions, review sources, consider safe actions, and continue learning without giving the model direct control over protected learner state.

**Intended pilot audience:** authenticated Cyberly learners in the teenage learner profile range used by the current application, plus reviewers validating the Public Beta 0.9 experience.

**Supported routes and surfaces:**

- Full CyberGuard route: `#/ai-chat`.
- Floating ChatWidget on authenticated non-chat routes.
- Dashboard CyberGuard entry area.

**Implemented pilot capabilities:**

- Compact CyberGuard workspace header.
- Non-interruptive AI transparency notice.
- Grid-based chat shell with desktop conversation scrolling.
- Mobile history drawer with focus movement, Escape close, and focus return.
- Semantic chat message log with `role="log"` and polite live-region behaviour.
- Assistant message presentation wrapper for answer, sources, proposals, and action cards.
- Stable assistant message region markers for structural tests.
- Source expansion/collapse controls with unique source list IDs per assistant message.
- Learner-controlled proposal presentation and confirmation/cancellation controls.
- Deterministic action card presentation through the existing chat action system.
- Empty state with four quick-start prompts.
- Quick prompts fill the composer draft without sending.
- Composer duplicate-submit prevention and visible sending state.
- Retry control for failed generation.
- Responsive full-page and floating-widget checks.
- English, Bahasa Melayu, and Simplified Chinese locale support for the pilot surfaces.

**Learner-control and safety boundaries:**

- CyberGuard does not execute controlled learner actions automatically.
- Quick prompts never auto-submit.
- Proposal confirmation remains explicit.
- Failed generation remains visible and retryable.
- Sources remain evidence/citation metadata, not arbitrary model-created routes.
- The pilot does not change backend safety validation, providers, RAG retrieval, database schema, or API contracts.

**Browser and viewport verification completed:**

- `#/ai-chat` authenticated route loaded successfully.
- 1440 x 900: no horizontal overflow; header, AI notice, message log, and composer visible.
- 1280 x 720: no horizontal overflow; header, AI notice, message log, and composer visible.
- 768 x 1024: no horizontal overflow; composer reachable and visible.
- 390 x 844: no horizontal overflow; composer reachable and visible.
- 360 x 640: no horizontal overflow; composer reachable by page scroll, matching the approved baseline limitation.
- Floating ChatWidget opened on Dashboard at mobile width with no horizontal overflow.
- Locale spot-check passed for English, Bahasa Melayu, and Simplified Chinese with no visible fallback translation keys.

**Automated verification summary:**

- Focused CyberGuard pilot test for the corrected first-message empty state passed.
- Retained CyberGuard/component test set passed.
- Locale verification passed.
- Full frontend test suite passed.
- Client production build passed.
- Root production build passed.
- Relevant backend chat test passed.

**Defect corrected during final certification:**

- `P6-1L-D1`: the no-active-conversation first-message state rendered the older empty state instead of the pilot empty state and quick prompts. A regression test was added, the failing state was reproduced, and the condition was corrected so the pilot empty state appears whenever the full-page chat has no messages and is not loading or in error.

**Known limitations:**

- Live source, proposal, and action-card examples were not naturally available in the current local conversation after the provider returned `AI provider request failed`; these contracts are covered by focused automated integration tests and prior approved fixture evidence.
- Pending provider reliability and prompt-tolerance issues remain outside the frontend pilot scope.
- The 360 x 640 low-height mobile viewport keeps the composer reachable by scroll rather than always visible in the first viewport.
- This handoff does not claim production-scale load, security, or deployment readiness.

**Known non-blocking warning:**

- The existing CRA/Node `fs.F_OK` deprecation warning remains during build and is not introduced by the CyberGuard pilot.

**Rollback or disable guidance:**

- No new runtime feature flag was introduced. Rollback should use normal source-control rollback of the CyberGuard pilot frontend changes.
- If the pilot must be withheld without code rollback, use existing application navigation and deployment controls only; do not add undocumented runtime switches.

**Support and escalation placeholders:**

- Product owner: to be assigned.
- Frontend maintainer: to be assigned.
- Backend AI maintainer: to be assigned.
- Safety/content reviewer: to be assigned.

**Release decision:** PILOT READY - YES.

## Z. Public Beta 0.9 Release Surface Inventory

This inventory identifies the files that form the CyberGuard Public Beta 0.9 frontend release surface. It does not claim pilot ownership of entire shared files where only a CyberGuard section is involved.

### A. Product Runtime

- `client/src/App.jsx`: owns the current CyberGuard full-page route composition, ChatProvider integration points, ChatMessageList usage, ChatSourceGroup, ChatComposer integration, ChatWidget integration, desktop sidebar, mobile drawer, retry state, and dashboard/widget entry points used by the pilot. This is a shared application file; only the CyberGuard-related sections are part of the pilot release surface.

### B. CyberGuard Presentation Components

- `client/src/cyberguard/CyberGuardWorkspaceHeader.jsx`
- `client/src/cyberguard/CyberGuardAiNotice.jsx`
- `client/src/cyberguard/CyberGuardChatShell.jsx`
- `client/src/cyberguard/CyberGuardEmptyState.jsx`
- `client/src/cyberguard/CyberGuardQuickPrompts.jsx`
- `client/src/cyberguard/CyberGuardComposerFrame.jsx`
- `client/src/cyberguard/CyberGuardAssistantMessage.jsx`
- `client/src/cyberguard/cyberguardLayout.css`

### C. Design Tokens and Primitives

- `client/src/design-system/tokens/cyberlyAurora.css`
- `client/src/design-system/primitives/Button.jsx`
- `client/src/design-system/primitives/IconButton.jsx`

These are pilot-owned foundations only to the extent currently consumed by CyberGuard Public Beta 0.9. They are not approval for a broad design-system migration.

### D. Locale Content

- `client/src/i18n/locales/en.json`
- `client/src/i18n/locales/ms.json`
- `client/src/i18n/locales/zh-CN.json`

Only the CyberGuard pilot keys and directly related labels are part of the frozen pilot surface.

### E. Automated Verification

- `client/src/cyberguard/CyberGuardPilot.test.jsx`
- `client/src/cyberguard/cyberguardTestUtils.jsx`
- `client/src/cyberguard/CyberGuardWorkspaceHeader.test.jsx`
- `client/src/cyberguard/CyberGuardAiNotice.test.jsx`
- `client/src/cyberguard/CyberGuardChatShell.test.jsx`
- `client/src/cyberguard/CyberGuardEmptyState.test.jsx`
- `client/src/cyberguard/CyberGuardQuickPrompts.test.jsx`
- `client/src/cyberguard/CyberGuardComposerFrame.test.jsx`
- `client/src/cyberguard/CyberGuardAssistantMessage.test.jsx`
- `client/src/cyberguard/cyberguardLayoutCss.test.js`
- `client/src/design-system/primitives/primitives.test.jsx`
- `client/src/design-system/tokens/cyberlyAuroraCss.test.js`

### F. Pilot Planning and Handoff Documentation

- `docs/production/product-experience/pilots/cyberguard-public-beta-pilot.md`
- `docs/production/product-experience/plans/cyberguard-public-beta-pilot-implementation-plan.md`
- `docs/production/README.md`, for production documentation index references only.

### G. Shared Dependencies Used but Not Owned by the Pilot

- ChatProvider orchestration and chat API wrappers.
- Existing authenticated routing/session restoration.
- Existing ReactMarkdown and `remark-gfm` rendering path.
- Existing backend chat, RAG, source, proposal, and action-card API contracts.
- Existing dashboard, navigation, footer, account menu, and language selector shell.
- Existing i18n infrastructure.

### H. Explicitly Excluded Areas

- Backend provider reliability and model behaviour.
- RAG retrieval and ingestion behaviour.
- Agentic AI execution semantics.
- Database schema, migrations, and seed data.
- Admin workflows.
- Scenario, assessment, progress, and recommendation business logic.
- Broad `App.jsx` refactoring outside the CyberGuard pilot sections.
- Full application redesign outside CyberGuard and the floating ChatWidget compatibility surface.

## AA. Public Beta 0.9 Freeze Policy

The CyberGuard Public Beta 0.9 frontend pilot is frozen unless a verified pilot defect exists.

### Freeze Scope

Frozen surfaces include:

- CyberGuard full-page layout.
- Compact workspace header.
- AI notice.
- ChatShell.
- Empty state.
- Four quick prompts.
- Full-page composer frame.
- Assistant presentation order.
- Source expansion.
- Proposal controls.
- Action cards.
- Mobile history drawer.
- Desktop history sidebar.
- Floating widget compatibility.
- Current locale copy.
- Aurora token use within the CyberGuard pilot.

### Permitted Post-Freeze Changes

Only these changes are permitted without reopening the pilot scope:

- Blocker defect fixes.
- High-severity accessibility or safety fixes.
- Confirmed data-loss or duplicate-action fixes.
- Clear pilot usability defects with repeatable evidence.
- Provider/backend fixes owned by separate work packages.
- Documentation corrections.
- Test corrections where production behaviour is already correct.

### Changes Not Permitted Without a New Approved Sprint

- Cosmetic polish.
- Spacing preference changes.
- Colour preference changes.
- New quick prompts.
- New actions.
- New Agentic behaviour.
- New AI provider behaviour.
- API contract changes.
- Database changes.
- Broad `App.jsx` refactoring.
- Component extraction for cleanliness only.
- Design-system expansion.
- New animations.
- Full widget redesign.
- Changing pilot wording without user evidence.

### Defect Evidence Requirement

Every post-freeze code change must include:

- Defect ID.
- Severity.
- Environment or viewport.
- Reproduction steps.
- Observed result.
- Expected result.
- Evidence.
- Minimal correction.
- Regression test.
- Verification result.

### Severity Model

- **Blocker:** primary learner flow cannot be completed, unsafe automatic action, data loss, authentication failure, or severe accessibility failure.
- **High:** key control unreachable, duplicate action, broken confirmation, major mobile failure, broken source relationship, or serious keyboard/focus failure.
- **Medium:** repeatable usability issue that materially affects the pilot.
- **Low:** cosmetic or subjective preference.

Only Blocker, High, and carefully approved meaningful Medium fixes may change the frozen implementation.

## AB. Pilot Handoff Checklist

Status markers:

- `[Live browser verified]` verified in the authenticated local browser.
- `[Automated test verified]` verified by the retained CyberGuard or full frontend test suite.
- `[Static contract verified]` verified by source inspection or static search.
- `[Deferred / provider-dependent]` accepted limitation or externally owned dependency.

### Product

- `[Static contract verified]` Version confirmed: CyberGuard Public Beta 0.9.
- `[Static contract verified]` Positioning confirmed: AI-supported cyber-wellness companion.
- `[Static contract verified]` Pilot audience confirmed: authenticated Cyberly learners and reviewers.
- `[Live browser verified]` Supported route confirmed: `#/ai-chat`.
- `[Live browser verified]` Supported floating widget surface confirmed on Dashboard.
- `[Live browser verified]` Supported locales confirmed: English, Bahasa Melayu, Simplified Chinese.

### Runtime

- `[Live browser verified]` Full-page frontend route loads.
- `[Live browser verified]` Authenticated flow loads the CyberGuard workspace.
- `[Live browser verified]` Floating widget opens and stays within mobile width.
- `[Live browser verified]` Empty state appears in first-message New Chat flow.
- `[Live browser verified]` Quick prompts fill draft only.
- `[Live browser verified]` Generation failure and Retry are visible.
- `[Automated test verified]` Sources render, expand, collapse, and retain unique IDs.
- `[Automated test verified]` Proposals render with learner-control wording and controls.
- `[Automated test verified]` Action cards render after proposal/actions ordering boundaries.

### Accessibility

- `[Live browser verified]` One full-page `role="log"` exists.
- `[Live browser verified]` Full-page log keeps `aria-live="polite"`.
- `[Automated test verified]` Assistant roots do not add live-region or alert semantics.
- `[Automated test verified]` Mobile drawer focus, Escape close, and focus return are retained.
- `[Automated test verified]` Quick prompts are buttons and do not submit.
- `[Automated test verified]` Composer form, textarea, loading, and disabled semantics are retained.
- `[Automated test verified]` Source `aria-controls` resolves and source IDs are unique per assistant message.
- `[Automated test verified]` Proposal confirmation remains explicit.

### Responsive

- `[Live browser verified]` Desktop 1440 x 900.
- `[Live browser verified]` Desktop 1280 x 720.
- `[Live browser verified]` Tablet 768 x 1024.
- `[Live browser verified]` Mobile 390 x 844.
- `[Live browser verified]` Short-height mobile 360 x 640 with composer reachable by page scroll.
- `[Live browser verified]` No horizontal overflow found in the certified viewport set.

### Verification

- `[Automated test verified]` Retained CyberGuard tests passed.
- `[Automated test verified]` Full frontend tests passed.
- `[Automated test verified]` Locale verification passed.
- `[Automated test verified]` Backend chat test passed.
- `[Automated test verified]` Client build passed.
- `[Automated test verified]` Root build passed.

### Safety and Operations

- `[Static contract verified]` No automatic controlled action.
- `[Live browser verified]` Quick prompts are draft-only.
- `[Automated test verified]` Proposal confirmation preserved.
- `[Live browser verified]` Provider failure remains visible.
- `[Static contract verified]` No frontend claim that a failed backend action succeeded.
- `[Static contract verified]` No database change.
- `[Static contract verified]` No migration.
- `[Static contract verified]` No environment change.
- `[Static contract verified]` No deployment.
- `[Static contract verified]` No credentials in documentation.
- `[Deferred / provider-dependent]` Live source/proposal/action examples require a healthy provider-backed local conversation.

## AC. Ownership and Escalation Responsibilities

- **Product owner:** to be assigned. Accepts pilot scope, approves Medium changes, and decides whether known limitations are acceptable for pilot use.
- **Frontend maintainer:** to be assigned. Owns the frozen CyberGuard UI, regression testing, responsive behaviour, accessibility corrections, and handoff documentation accuracy.
- **Backend AI maintainer:** to be assigned. Owns provider reliability, generation failures, model integration, RAG, and backend chat behaviour.
- **Safety/content reviewer:** to be assigned. Reviews learner-facing guidance, AI transparency wording, action consequences, and minor-safety concerns.

## AD. Public Beta 0.9 Implementation Summary

- Established Cyberly Aurora CSS token foundation for the CyberGuard pilot.
- Added initial Button and IconButton primitives used by the pilot.
- Replaced the oversized full-page CyberGuard hero with a compact workspace header.
- Added the non-interruptive AI transparency notice.
- Introduced the responsive CyberGuard ChatShell and layout CSS.
- Added bounded empty state and four draft-only quick prompts.
- Added the presentation-only composer frame while preserving composer state ownership.
- Added assistant message presentation boundary and structural ordering tests.
- Preserved answer -> sources -> proposal -> actions ordering.
- Corrected duplicate source DOM ID scoping for repeated source sets.
- Corrected the first-message New Chat state so quick prompts appear when no active conversation exists.
- Completed browser acceptance for full-page CyberGuard, mobile drawer, locale switching, and floating widget compatibility.
- Certified the pilot as `PILOT READY - YES` after retained CyberGuard tests, full frontend tests, backend chat test, locale verification, client build, and root build passed.

## AE. Known Limitations and Non-Production Claims

- Provider reliability remains unresolved and belongs to backend/provider work.
- Live source/proposal/action browser verification was unavailable during final certification because the current local provider returned `AI provider request failed`; these contracts have automated integration coverage.
- The 360 x 640 short-height viewport uses page scrolling to reach the composer.
- Production-scale performance was not tested.
- Production security certification was not performed.
- Deployment was not performed.
- CyberGuard Public Beta 0.9 is a controlled pilot baseline, not an unrestricted public production release.

## AF. CyberGuard 0.10 Development Acceptance Record

**Status date:** July 30, 2026.

This section records accepted CyberGuard 0.10 development enhancements after the certified CyberGuard Public Beta 0.9 baseline. These records do not supersede the Public Beta 0.9 certification or reopen the frozen 0.9 pilot scope.

### Accepted 0.10 Enhancements

- `P8-1` Conversation Search Foundation: ACCEPTED - YES.
- `P8-2` Conversation Organisation Foundation: ACCEPTED - YES.
- `P8-3` Collapsible Conversation Date Groups: ACCEPTED - YES.
- `P8-3R1` Conversation Group Chevron Visual Refinement: ACCEPTED - YES.
- `P8-4A` Automatic Conversation Title Foundation: ACCEPTED - YES.
- `P8-5` Conversation Pinning Foundation: ACCEPTED - YES.
- `P8-6` Conversation Archive Foundation: ACCEPTED - YES.
- `P8-7` Export Conversation Foundation: ACCEPTED - YES.
- `P8-7R3` Export Dialog Mobile Drawer Layering and Escape Ownership: ACCEPTED - YES.
- `P10-2` RAG Source Relevance Guard and Topic-Aware Source Selection: ACCEPTED - YES.

### P8-4A Owner Runtime Acceptance

`P8-4A OWNER DESKTOP RUNTIME ACCEPTANCE - PASSED`.

Observed runtime evidence:

- A newly created conversation was automatically titled `How can I identify a fake banking message?`.
- Another newly created conversation was automatically titled `How can I check a suspicious SMS?`.
- A first message containing newlines and repeated whitespace was normalised into the sidebar title `How can I identify phishing links?`.
- The active conversation remained selected after automatic title persistence.
- No duplicate conversation was observed.
- Today / Yesterday / Earlier grouping and collapse controls remained intact.
- Assistant generation was still triggered.

Some assistant replies failed because of the existing AI provider/runtime path and correctly displayed the existing retry state. This is recorded as a separate existing runtime issue, not a P8-4A regression and not a blocker for automatic title persistence.

### P8-7R3 Owner Runtime Acceptance

`P8-7R3 OWNER MANUAL RUNTIME ACCEPTANCE - PASSED`.

`P8-7R3 ACCEPTED - YES`.

`P8-7 Export Conversation Foundation - ACCEPTED - YES`.

Observed mobile drawer runtime evidence:

- The Export Conversation dialog appeared visually above the History Drawer.
- The Export Conversation dialog backdrop covered the Drawer and underlying page.
- The first Escape key press closed only the Export Conversation dialog.
- The History Drawer remained open after the first Escape key press.
- Focus returned correctly to the originating conversation menu button.
- The second Escape key press closed the History Drawer.
- Focus returned to the global History trigger.
- No duplicate Export menu item or Export dialog appeared.
- Existing export format selection and download behaviour remained functional.

This acceptance preserves the Public Beta 0.9 certified baseline, the accepted P8-1 through P8-6 conversation-management behaviours, and the existing backend, API, database, provider, RAG, and Agentic AI boundaries. Existing unrelated runtime warnings and provider issues remain tracked separately and are not P8-7R3 regressions.

### P10-2 Owner Runtime Acceptance

`P10-2 OWNER RUNTIME VERIFICATION - PASSED`.

`P10-2 ACCEPTED - YES`.

Observed authenticated learner runtime evidence:

- `How can I identify a fake banking message?` returned highly relevant sources.
- Phishing appeared first.
- Online Scam appeared second.
- No Misinformation, Deepfakes, Privacy, Cyberbullying, or other weakly related sources appeared.
- No duplicate resource appeared.
- Only two strong sources were shown rather than padding the answer with weak sources.
- Source links and learner-visible metadata remained intact.
- Follow-up actions remained unchanged.
- Repeated generation preserved the same relevant source ordering.

This acceptance preserves the Public Beta 0.9 certified baseline, all accepted P8 conversation-management behaviour, all accepted P9 AI reliability behaviour, and the existing database, provider, Scope, Agentic AI, frontend, and API-contract boundaries. No database migration, provider change, Scope change, Agentic AI change, frontend change, or API contract change is recorded for this acceptance update.

### Baseline Preservation

- CyberGuard Public Beta 0.9 certified baseline: preserved.
- P8-1 accepted status: unchanged.
- P8-2 accepted status: unchanged.
- P8-3 accepted status: unchanged.
- P8-3R1 accepted status: unchanged.
- P8-4A accepted status: unchanged.
- P8-5 accepted status: unchanged.
- P8-6 accepted status: unchanged.
- P8-7 accepted status: unchanged.
- P8-7R3 accepted status: unchanged.
- P9 accepted behaviour: unchanged.
- P10-2 accepted status: recorded.
- Backend, API contracts, database schema, providers, RAG, Agentic AI, CSS, locales, search, grouping, collapse behaviour, and Composer visuals were not changed by the acceptance-record update.

## AG. AUTH-EV Email Verification - Final Acceptance

**Status date:** August 8, 2026.

This record closes the AUTH-EV implementation series and certifies the current Authentication V1 email-verification behaviour. It does not approve account-recovery or guardian workflows.

- `AUTH-EV DATABASE/TOKEN FOUNDATION - ACCEPTED`.
- `AUTH-EV AUTH/API INTEGRATION - ACCEPTED`.
- `AUTH-EV CYBERGUARD VERIFIED-EMAIL GATE - ACCEPTED`.
- `AUTH-EV FRONTEND UX - ACCEPTED`.
- `AUTH-EV SMTP TRANSPORT - ACCEPTED`.
- `AUTH-EV FAILURE HANDLING - ACCEPTED`.
- `AUTH-EV EMAIL MASKING - ACCEPTED`.
- `AUTH-EV TOKEN URL PRIVACY - ACCEPTED`.
- `AUTH-EV RESULT RELOAD PERSISTENCE - ACCEPTED`.
- `AUTH-EV DIFFERENT-ACCOUNT SESSION SAFETY - ACCEPTED`.
- `AUTH-EV AUTOMATED VERIFICATION - PASSED`.
- `AUTH-EV OWNER EMAIL DELIVERY VERIFICATION - PASSED`.
- `AUTH-EV OWNER BROWSER RUNTIME VERIFICATION - PASSED`.
- `AUTH-EV FINAL ACCEPTANCE - PASSED`.

### Owner Runtime Evidence

- A real Gmail verification message was received using environment-configured SMTP.
- A valid link successfully verified its account, and the expected masked email prefix was displayed.
- The same-account success result survived browser reload.
- Reusing a consumed link produced the neutral already-verified result, which also survived reload.
- Account B remained the active authenticated session while an Account A verification link was processed.
- The different-account notice survived reload without changing Account B's verification state.
- A fresh tokenless `#/verify-email` route remained invalid.
- The raw verification token was removed from the browser URL after capture.

No SMTP password, Gmail App Password, raw token, sensitive provider configuration, or complete owner verification URL is recorded here.

### Certified Behaviour Snapshot

**Registration.** A newly registered account starts unverified. Registration succeeds independently of email-delivery success and returns only safe delivery/verification metadata.

**Verification.** Verification tokens are persisted as hashes; raw tokens are not stored. Tokens support expiry, revocation, one-time use, and revocation of older active tokens when a newer token is issued. A valid token verifies the account. A consumed token returns a neutral already-verified success. Verification does not create or switch an authenticated session.

**Resend.** Resend requires an authenticated session. The server derives the target user and email, enforces cooldown, and returns safe failure metadata. Failed delivery does not establish a false successful-delivery cooldown.

**CyberGuard gate.** Unverified learners may read existing conversation history. New generation, reply generation, and retry are blocked until verification; a verified session unlocks these operations.

**Frontend.** The certified interface includes the verification reminder, masked email display, result page, token removal from the URL, and five-minute privacy-limited same-tab `sessionStorage` presentation persistence. Persisted presentation state contains no token, email, or user ID. A direct tokenless route remains invalid, and processing another account's link does not replace the active session.

**SMTP.** The transport supports disabled, deterministic test-success/test-fail, and SMTP modes. Gmail-compatible SMTP is configured only through backend runtime environment variables. Public responses do not expose transport credentials or provider diagnostic payloads.

### Non-Blocking Human-Review Notes

- The current verification email is intentionally simple and may receive separate visual-branding work later.
- The existing CRA `fs.F_OK` deprecation warning is unrelated to AUTH-EV acceptance.
- Existing JSDOM network and asynchronous `act(...)` console noise is unrelated where the certified suites pass.
- DB-backed verification scripts require correctly configured local MySQL credentials.
- SMTP and Gmail App Password setup remains environment-specific and must stay outside the repository.

### Feature Freeze

`AUTHENTICATION V1 EMAIL VERIFICATION FEATURE - FROZEN`.

The certified behaviour must not receive further feature development before Public Beta unless a regression, security defect, or release-blocking UX defect is confirmed. Forgot Password, Forgot Email/account recovery, Parent/Guardian Email Binding, Guardian Confirmation, and broader Account Security/Recovery are separate future scopes.

## AH. PB-ACCEPT-1 - Full Learner Journey Owner Runtime Acceptance

`PB-ACCEPT-1A ENGLISH DESKTOP - PASSED`.

`PB-ACCEPT-1B MOBILE - PASSED`.

`PB-ACCEPT-1C BAHASA MELAYU - PASSED`.

`PB-ACCEPT-1D SIMPLIFIED CHINESE - PASSED`.

`PB-ACCEPT-1 FULL LEARNER JOURNEY - PASSED`.

The owner completed the full English desktop learner journey. Mobile acceptance passed after the `PB-FIX-1-M01` Scenario responsive correction. Bahasa Melayu and Simplified Chinese smoke acceptance passed across the key learner surfaces.

### Certified Learner Journey

The bounded owner runtime acceptance covers:

Register -> Email Verification -> Onboarding -> Initial Assessment -> Dashboard -> Recommended Resource -> Scenario Learning -> Progress -> CyberGuard -> Logout -> Login -> Persistence / Refresh Recovery.

This acceptance certifies a coherent first-time learner journey, registration entry, email-verification integration, onboarding, assessment, dashboard use, learning-resource access, Scenario learning, progress update, CyberGuard use, logout and login, learner-state persistence, refresh recovery, desktop usability, mobile usability, and key-flow usability in Bahasa Melayu and Simplified Chinese.

### PB-FIX-1-M01 - Scenario Practice Mobile Confirmation Layout

**Defect:** The Scenario Practice confirmation/detail page collapsed into an unreadably narrow content column on mobile.

**Severity:** HIGH and mobile release-blocking.

**Root cause:** The mobile `.scenario-detail-layout` declaration appeared before the desktop three-column declaration. Because the selectors had equal specificity, the later desktop grid overrode the mobile layout at narrow widths.

**Correction:** The desktop grid was preserved, the layout was made shrink-safe, and the mobile override was placed after the desktop declaration with a `minmax(0, 1fr)` single-column grid and full available width. No font shrinking, clipping, scaling, forced character breaking, or overflow-hiding workaround was used.

**Automated acceptance:** PASSED.

**Owner runtime acceptance:** PASSED at 430 x 932, 390 x 844, 360 x 640, and 320px width/reflow. The owner also completed a Scenario through its result and Progress update after the correction with no functional regression.

`PB-FIX-1-M01 OWNER MOBILE RETEST - PASSED`.

`PB-FIX-1-M01 - ACCEPTED`.

`PB-FIX-1-M01 - CLOSED`.

### Acceptance Boundary

This is bounded Public Beta owner runtime acceptance. It does not claim formal penetration testing, production deployment certification, coverage of every browser or device, exhaustive accessibility certification, exhaustive locale or content proofreading, or load and performance certification. Deployment, runtime operations, and release certification remain separate work.
