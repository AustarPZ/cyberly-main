# CyberGuard Public Beta 0.9 Certification

## Release Decision

Pilot Ready: YES

Freeze Baseline: RESTORED

Owner Runtime Acceptance: PASSED

Release version: CyberGuard Public Beta 0.9

Certification date: 2026-07-29

## Certified Scope

This certification covers the accepted CyberGuard Public Beta 0.9 learner experience:

- Full-page CyberGuard workspace
- Conversation History
- New Chat
- Message Log
- Composer
- Quick Prompts
- Markdown answers
- Sources
- Suggested actions
- Learner confirmation proposals
- Responsive History Drawer
- Accessibility baseline

## Certified Layout Contract

The certified CyberGuard full-page route uses natural outer document scrolling. The global navbar, workspace header, AI-supported guidance notice, and ChatShell remain in normal document flow, and the standard application Footer remains excluded from `#/ai-chat`.

The ChatShell is a bounded responsive panel. It does not grow with accumulated messages, is not globally fixed, and keeps its internal layout contained with `overflow: hidden`.

The Message Log owns vertical message scrolling. Long assistant replies, Sources, proposals, and action cards remain inside the Message Log rather than expanding the outer document. The Composer remains inside the ChatShell bottom row and moves with the ChatShell when the outer document scrolls.

Conversation History scrolls independently. Desktop uses the sidebar-local collapse and reopen controls, while mobile and narrow layouts expose the workspace-header History control for the existing drawer. The New Chat control remains the approved Indigo/blue-purple primary design-system button.

## Certified Runtime Behavior

Owner runtime acceptance was confirmed after local visual and interaction review following the P6-1M-R3 corrective implementation.

No screenshots, viewport measurements, or browser-console artifacts are recorded in this document beyond the owner acceptance statement and the automated verification evidence below.

## Automated Evidence

The following P7 certification commands were run from `C:\Users\AsusT\Documents\Codex\cyberly-main`.

| Command | Result |
|---|---|
| `npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/cyberguardLayoutCss.test.js src/cyberguard/CyberGuardWorkspaceHeader.test.jsx src/cyberguard/CyberGuardPilot.test.jsx` | PASS: 3 suites, 41 tests |
| `node scripts/verify-locales.js` | PASS: locale JSON valid, key structure matches, interpolation placeholders match, no duplicate keys |
| `npm --prefix client test -- --watchAll=false` | PASS: 39 suites, 248 tests |
| `npm --prefix server run test:chat` | PASS: Chat backend verification passed |
| `npm --prefix client run build` | PASS: production build compiled successfully |
| `npm run build` | PASS: root build delegated to client build and compiled successfully |

The client and root build commands both emitted the existing CRA/Node warning:

`[DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead`

## Runtime Boundary

P7 certification did not change the runtime implementation. The certified boundary records the current accepted behavior.

Unchanged runtime areas:

- ChatProvider orchestration
- chat APIs
- conversation creation
- Markdown rendering
- source behavior
- proposal behavior
- action behavior
- quick prompts
- floating widget
- backend behavior
- database schema and migrations
- provider configuration
- RAG behavior
- Agentic AI behavior
- environment files

## Known Non-Blocking Notes

- CRA/Node `fs.F_OK` deprecation warning remains during client builds.
- Existing working-tree changes pre-date P7 and are not automatically attributed to this certification phase.
- Deployment was not performed.
- Commit and push were not performed.
- This document does not replace future staging or production release checks.

## Freeze Rule

After this certification, any future change to the certified CyberGuard Public Beta 0.9 baseline must:

1. Have a new task identifier.
2. State the verified reason for change.
3. Include focused regression coverage.
4. Repeat relevant viewport and runtime acceptance.
5. Explicitly state whether the Public Beta 0.9 freeze is being superseded.
