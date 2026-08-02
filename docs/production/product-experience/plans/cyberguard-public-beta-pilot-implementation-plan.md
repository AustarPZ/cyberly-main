# CyberGuard Public Beta Pilot Implementation Plan

> For agentic workers: execute this plan task-by-task. Each task requires focused review and verification before the next task begins.

**Goal:** Implement the approved CyberGuard Public Beta 0.9 frontend pilot without changing backend contracts, database behaviour, provider behaviour, prompt tolerance, or Agentic execution semantics.

**Architecture:** Use gradual extraction from `client/src/App.jsx`. Introduce only the minimum tokens, primitives, shared components, and CyberGuard domain components needed for the pilot. Preserve current chat state orchestration, API calls, Markdown rendering, source/proposal/action ordering, accessibility behaviour, and mobile drawer focus management unless the specification explicitly changes them.

**Tech Stack:** React, Create React App, custom hash routing, i18next/react-i18next, react-markdown, remark-gfm, existing CSS/testing tools.

## Global Constraints

- Target users are Malaysian teenagers aged 13-17.
- Product direction is 75% Digital Companion and 25% Cyber Adventure.
- CyberGuard must feel encouraging, trustworthy, empowering, curious, calm, and youthful without becoming childish.
- Use the approved Cyberly Aurora initial target values:
  - Cyber Indigo 600: `#5356D9`
  - Digital Mint 500: `#25BFA2`
  - Explorer Coral 500: `#FF6F61`
  - Achievement Gold 500: `#F5B942`
  - Page Background: `#F7F8FC`
  - Surface Primary: `#FFFFFF`
  - Surface Secondary: `#F0F2F8`
  - Text Primary: `#202438`
  - Text Secondary: `#5E6478`
  - Border Soft: `#E2E5EE`
  - Success: `#168A63`
  - Warning: `#C77A12`
  - Error: `#D64550`
  - Information: `#2878C8`
- Brand colours and functional colours must remain separate.
- Explorer Coral is not the error colour.
- Achievement Gold is only for meaningful milestones.
- All new learner-facing copy must use i18n.
- English, Bahasa Melayu, and Simplified Chinese must be supported.
- Future Tamil support must not be blocked by fixed widths or font assumptions.
- No autoplay music or sound implementation in this pilot.
- Do not communicate important information through colour, sound, or motion alone.
- Preserve reduced-motion behaviour.
- Preserve `role="log"`, `aria-live`, source-toggle semantics, drawer Escape, and drawer focus return.
- Preserve Markdown rendering.
- Preserve source, proposal, and action ordering.
- No API-contract changes.
- No database or migration changes.
- No provider-reliability fixes.
- No prompt-tolerance or classifier changes.
- No new Agentic action types.
- No full `App.jsx` rewrite.
- No router or build-tool migration.
- Avoid new large inline-style blocks.
- Do not modify `server/.env`.
- Do not commit or perform Git history/branch operations unless explicitly instructed during a later implementation phase.

---

## Repository Evidence

Current implementation facts used by this plan:

- Official frontend package: `client/package.json`.
- CRA test command: `npm --prefix client test -- --watchAll=false`.
- Production build command: `npm --prefix client run build`.
- Root build command: `npm run build`.
- Locale verification command: `node scripts/verify-locales.js`.
- CyberGuard full-page route: `client/src/App.jsx`, `AIChatPage`.
- Floating widget: `client/src/App.jsx`, `ChatWidget`.
- Chat state/orchestration: `client/src/App.jsx`, `ChatProvider` and `useChat` consumers.
- Message rendering: `client/src/App.jsx`, `ChatMessageList`.
- Composer: `client/src/App.jsx`, `ChatComposer`.
- Source/action/proposal rendering: `client/src/App.jsx`, `ChatSourceGroup`, `ChatActionCard`, `ChatMessageProposal`.
- Chat API wrapper: `client/src/chat/chatApi.js`.
- Chat action helpers and tests: `client/src/chat/chatActions.js`, `client/src/chat/chatActions.test.js`.
- Existing frontend test style: colocated Jest tests in `client/src/**`.
- Locale files: `client/src/i18n/locales/en.json`, `client/src/i18n/locales/ms.json`, `client/src/i18n/locales/zh-CN.json`.
- Global styles currently concentrated in `client/src/App.jsx` in `globalStyle`; minimal base CSS is in `client/src/index.css`.
- Admin file-splitting pattern exists under `client/src/admin/`, for example `AdminWorkspace.jsx`, `AdminSidebar.jsx`, and colocated tests.

## Proposed File Map

### Files to Create

- `client/src/design-system/tokens/cyberlyAurora.css`: single runtime source for pilot CSS Custom Properties and approved Cyberly Aurora values.
- `client/src/design-system/tokens/cyberlyAuroraCss.test.js`: verifies the CSS token file contains the approved values once and that brand/status roles remain distinct.
- `client/src/design-system/primitives/Button.jsx`: semantic button primitive for CyberGuard pilot controls.
- `client/src/design-system/primitives/IconButton.jsx`: semantic icon-button primitive with required accessible name.
- `client/src/design-system/primitives/primitives.test.jsx`: verifies semantic tags, variants, accessible names, disabled/loading attributes, and prohibited colour props.
- `client/src/cyberguard/WorkspaceHeader.jsx`: compact CyberGuard workspace header.
- `client/src/cyberguard/AIContentNotice.jsx`: compact AI transparency notice.
- `client/src/cyberguard/ChatShell.jsx`: layout shell for history and active chat regions.
- `client/src/cyberguard/ChatEmptyState.jsx`: bounded empty state with quick prompts.
- `client/src/cyberguard/QuickPrompt.jsx`: fills the composer without sending.
- `client/src/cyberguard/ChatErrorState.jsx`: learner-facing failed-generation display.
- `client/src/cyberguard/ChatMessage.jsx`: message bubble and Markdown presentation.
- `client/src/cyberguard/SourceSummary.jsx`: reviewed-source summary and expansion UI.
- `client/src/cyberguard/ActionCard.jsx`: deterministic follow-up action presentation.
- `client/src/cyberguard/ProposalCard.jsx`: learner-controlled proposal presentation.
- `client/src/cyberguard/ChatWidgetPreview.jsx`: lightweight floating companion preview.
- `client/src/cyberguard/cyberguardLayout.css`: CyberGuard pilot CSS that consumes token variables from `cyberlyAurora.css` and does not repeat approved HEX values.
- `client/src/cyberguard/cyberguardTestUtils.jsx`: local render utilities and fixture data for CyberGuard tests.
- `client/src/cyberguard/CyberGuardPilot.test.jsx`: page-level and component-level pilot tests.
- `client/src/cyberguard/ChatWidgetPreview.test.jsx`: focused floating widget tests.

### Files to Modify

- `client/src/App.jsx`: import pilot CSS, replace the current AI Chat hero block, wire extracted CyberGuard presentation components, keep chat orchestration in place.
- `client/src/i18n/locales/en.json`: add CyberGuard pilot text keys.
- `client/src/i18n/locales/ms.json`: add matching Malay text keys.
- `client/src/i18n/locales/zh-CN.json`: add matching Simplified Chinese text keys.

### Test Files

- `client/src/cyberguard/CyberGuardPilot.test.jsx`.
- `client/src/cyberguard/ChatWidgetPreview.test.jsx`.
- `client/src/design-system/tokens/cyberlyAuroraCss.test.js`.
- `client/src/design-system/primitives/primitives.test.jsx`.
- Existing retained tests: `client/src/chat/chatActions.test.js`, `client/src/chat/chatApi.test.js`.

### Documentation Files

- No documentation updates are required during implementation unless the implementation discovers a specification conflict. If that happens, pause and ask for scope approval before changing docs.

### Files Intentionally Left Unchanged

- `server/**`.
- `server/.env`.
- `server/migrations/**`.
- `client/package.json`.
- `client/package-lock.json`.
- `client/src/chat/chatApi.js`.
- `client/src/api/**`.
- `client/src/chat/chatActions.js`, unless an implementation task proves a presentation-only helper is required.
- Dashboard, Resources, Scenario, Profile, Progress, and Admin page implementations.

## File Granularity Review

This revision keeps only files with confirmed pilot consumers:

- Keep `Button.jsx` because header, empty-state prompts, retry controls, proposal controls, and action controls need one semantic button baseline.
- Keep `IconButton.jsx` because existing CyberGuard history, drawer, close, and compact controls are icon-first controls requiring accessible names.
- Do not create a badge primitive in this pilot; the approved CyberGuard tasks do not require a reusable status badge beyond ordinary text labels.
- Do not create a surface primitive in this pilot; `WorkspaceHeader`, `AIContentNotice`, empty/error states, and shell regions can use semantic elements plus scoped classes.
- Do not create a textarea primitive before composer extraction; the current `ChatComposer` owns its native textarea behaviour and only needs the narrow draft-request interface in Task 5.
- Keep `ActionCard.jsx` as one focused file exporting `ActionCard` and named `ActionCardGroup`, because individual action and grouped layout always change together in the pilot.

## App.jsx Extraction Boundary

Allowed extraction:

- Extract stable CyberGuard presentation components listed in the file map.
- Move CyberGuard-only CSS from `globalStyle` into `client/src/cyberguard/cyberguardLayout.css`.
- Keep class names or compatibility aliases where needed for existing behaviour and tests.
- Keep `ChatProvider`, chat API orchestration, message sending, generation retry, action execution, conversation selection, rename, and delete orchestration in `client/src/App.jsx`.
- Before adding a replacement selector, identify the old CyberGuard-specific selector in `globalStyle`.
- Remove the old selector after the new component/style owns the behaviour.
- Preserve shared selectors only when another current consumer still uses them.
- Do not use `!important` to resolve migration conflicts.
- Every implementation report must list selectors removed, selectors retained, and temporary compatibility selectors.
- Every temporary compatibility selector must name the later task that removes it.

Not allowed in this pilot:

- Moving `ChatProvider`.
- Moving API orchestration solely for cleanliness.
- Rewriting unrelated Dashboard, Resources, Scenario, Profile, Progress, or Admin code.
- Reformatting the entire `App.jsx`.
- Converting all global CSS.
- Removing legacy CSS unrelated to CyberGuard.
- Changing API response shapes.

Likely merge-conflict zones:

- `client/src/App.jsx` around the `globalStyle` chat CSS.
- `client/src/App.jsx` around `ChatMessageList`, `ChatComposer`, source/action/proposal components.
- `client/src/App.jsx` around `AIChatPage` and `ChatWidget`.
- `client/src/i18n/locales/*.json` around the `chat` object.

Tasks that touch `App.jsx` should be implemented sequentially.

## Translation Keys

Use these exact new keys unless implementation reveals an existing key with identical meaning:

- `chat.pilot.header.kicker`
- `chat.pilot.header.title`
- `chat.pilot.header.description`
- `chat.pilot.header.currentConversation`
- `chat.pilot.notice.title`
- `chat.pilot.notice.description`
- `chat.pilot.empty.title`
- `chat.pilot.empty.description`
- `chat.pilot.empty.promptNext`
- `chat.pilot.empty.promptExplainIssue`
- `chat.pilot.empty.promptInstruction`
- `chat.pilot.error.title`
- `chat.pilot.error.provider`
- `chat.pilot.error.retry`
- `chat.pilot.widget.title`
- `chat.pilot.widget.description`
- `chat.pilot.widget.openFull`
- `chat.pilot.widget.recentContext`
- `chat.pilot.widget.startPrompt`
- `chat.pilot.widget.hiddenOlderMessages`

## Token Names

Use these exact token names:

- `--cyberly-indigo-600`
- `--cyberly-mint-500`
- `--cyberly-coral-500`
- `--cyberly-gold-500`
- `--cyberly-page-bg`
- `--cyberly-surface-primary`
- `--cyberly-surface-secondary`
- `--cyberly-text-primary`
- `--cyberly-text-secondary`
- `--cyberly-border-soft`
- `--cyberly-success`
- `--cyberly-warning`
- `--cyberly-error`
- `--cyberly-info`
- `--cyberly-focus-ring`
- `--cyberly-radius-control`
- `--cyberly-radius-panel`
- `--cyberly-space-page-gutter`
- `--cyberly-chat-message-max`
- `--cyberly-chat-drawer-width`
- `--cyberly-motion-fast`
- `--cyberly-motion-panel`

## Component Interfaces

```jsx
<Button variant="primary|secondary|quiet|danger" loading={false} disabled={false} onClick={fn}>
  Label
</Button>

<IconButton label="Open chat history" variant="quiet|primary" onClick={fn}>
  <span aria-hidden="true">...</span>
</IconButton>

<WorkspaceHeader
  title={title}
  description={description}
  conversationTitle={activeConversationTitle}
  updatedLabel={updatedLabel}
  onNewChat={handleCreateConversation}
/>

<AIContentNotice title={noticeTitle} description={noticeDescription} />

<ChatShell
  sidebar={sidebarNode}
  main={mainNode}
  drawer={drawerNode}
  drawerOpen={historyDrawerOpen}
/>

<ChatEmptyState onPromptSelect={({ text, requestId }) => setComposerDraftRequest({ text, requestId })} compact={false} />

<QuickPrompt label={label} prompt={prompt} onSelect={fn} />

<ChatErrorState message={safeMessage} onRetry={retryGeneration} />

<ChatMessage message={message} compact={false} />

<SourceSummary sources={sources} compact={false} />

<ActionCard action={action} compact={false} onAction={handleChatAction} />

<ProposalCard proposal={proposal} onConfirm={confirmFn} onCancel={cancelFn} />

<ChatWidgetPreview
  open={open}
  user={user}
  recentMessages={recentMessages}
  fullPageHref="#/ai-chat"
  onOpenFullPage={openFullPage}
  onClose={closeWidget}
/>
```

---

## Task 1 — Baseline Tests and Pilot Verification Harness

**Purpose:** Create the minimum automated and manual baseline needed to protect current CyberGuard behaviour before visual extraction.

**Files:**

- Create: `client/src/cyberguard/cyberguardTestUtils.jsx`
- Create: `client/src/cyberguard/CyberGuardPilot.test.jsx`
- Modify: none in runtime code for this task
- Inspect: `client/src/App.jsx`, `client/src/chat/chatActions.test.js`, `client/src/chat/chatApi.test.js`

**Interfaces:**

- Consumes: current `client/src/App.jsx` exported default application and current browser-level route behaviour.
- Produces: `renderCyberGuardPilotFixture({ route, user, messages, sources, actions, proposal, locale })` test utility and baseline tests later tasks must keep passing.

- [ ] **Step 1: Complete the required testability audit checkpoint**

Before creating helpers, inspect the current mount path and record these exact boundaries in comments at the top of `cyberguardTestUtils.jsx`:

- Mount-time API calls:
  - `client/src/App.jsx` calls `dbMe()` during session restore.
  - `ChatProvider` calls `listChatConversations(50)` when an authenticated `user.id` exists.
  - Active conversation loading calls `getChatConversation(conversationId)` after a conversation is selected/restored.
- Modules/functions to mock:
  - `client/src/api/authApi.js`: `getCurrentUser`, `logout`, and auth wrappers only when the test reaches auth flows.
  - `client/src/chat/chatApi.js`: `listChatConversations`, `createChatConversation`, `getChatConversation`, `createChatUserMessage`, `generateChatAssistantReply`, `renameChatConversation`, and `deleteChatConversation`.
  - `client/src/api/profileApi.js` and `client/src/api/accountApi.js` only for tests that navigate into profile/account flows.
- Authentication bootstrap behaviour:
  - Provide a successful `getCurrentUser` result for authenticated fixtures.
  - Provide an unsuccessful `getCurrentUser` result for unauthenticated fixtures.
  - Keep `window.location.hash` set before rendering because routing is custom hash routing.
- Onboarding/profile redirect behaviour:
  - Authenticated fixture users must include the current fields required by `normalizeSessionUser`, including `profile.onboardingCompleted`, to avoid unwanted redirects.
  - Tests that intentionally verify redirect behaviour must use a fixture with `onboardingCompleted: false`.
- Chat conversation loading behaviour:
  - Return a conversation list containing the fixture active conversation.
  - Return conversation detail containing mapped `messages`, `actions`, `sources`, and proposal state matching current chat API shapes.
- Current route setup:
  - Set `window.history.replaceState(..., "", route)` or `window.location.hash = route` before rendering.
  - Use `#/ai-chat` for full-page CyberGuard and a non-chat route such as `#/dashboard` for widget tests.
- Browser API shims:
  - Provide safe shims for `window.scrollTo`, `Element.prototype.scrollTo`, reduced-motion `matchMedia`, and layout fields used by the auto-scroll code when JSDOM lacks them.
- Runtime export boundary:
  - Use the default `App` export. Do not add runtime exports for test convenience.

If the baseline requires modifying runtime exports, production state orchestration, or adding a test-only path in application code, stop and request approval before proceeding.

- [ ] **Step 2: Create CyberGuard test utility skeleton**

Create `client/src/cyberguard/cyberguardTestUtils.jsx` with fixture constants and render helpers using React Testing Library. Use the existing `client/src/setupTests.js` Jest DOM setup. The helper should export:

```jsx
export const authenticatedLearner = {
  id: 1,
  email: "learner@example.test",
  displayName: "Test Learner",
  age: 16,
  role: "user",
};

export const assistantMessageWithEverything = {
  id: 22,
  role: "ai",
  text: "## Stay safe\nCheck links before tapping.",
  sources: [
    {
      id: 1,
      title: "Suspicious Links",
      sourceLabel: "Cyberly Resource",
      sourceUrl: "https://example.com/source",
      snippet: "Look for urgent language and mismatched URLs.",
      internalTarget: { page: "resources", resourceSlug: "suspicious-links" },
      citationOrder: 1,
    },
  ],
  actions: [
    {
      id: 9,
      type: "scenario",
      labelKey: "chat.actions.startScenario",
      title: "Try a phishing scenario",
      description: "Practise spotting suspicious links.",
      target: { page: "scenarios", scenarioSlug: "phishing-practice" },
      displayOrder: 1,
    },
  ],
  proposal: {
    proposalId: "proposal-1",
    actionType: "open_resource",
    title: "Open resource",
    explanation: "Review this resource.",
    consequence: "Nothing changes until you confirm.",
    requiresConfirmation: true,
    status: "pending",
    confirmationToken: "token-1",
    target: { type: "resource", id: 1, label: "Suspicious Links" },
  },
};
```

- [ ] **Step 3: Write baseline tests against current behaviour**

Create `client/src/cyberguard/CyberGuardPilot.test.jsx` with tests that document current behaviour:

```jsx
test("CyberGuard page keeps the message log accessible", () => {
  renderCyberGuardPilotFixture({ route: "#/ai-chat", user: authenticatedLearner });
  expect(screen.getByRole("log", { name: /chat message history/i })).toBeInTheDocument();
});

test("message content renders Markdown, sources, proposal, and actions with current semantics", async () => {
  const user = userEvent.setup();
  renderCyberGuardPilotFixture({
    route: "#/ai-chat",
    user: authenticatedLearner,
    messages: [{ id: 21, role: "user", text: "Help" }, assistantMessageWithEverything],
  });
  const log = screen.getByRole("log", { name: /chat message history/i });
  expect(within(log).getByRole("heading", { name: /stay safe/i })).toBeInTheDocument();
  const sourceToggle = within(log).getByRole("button", { name: /show sources/i });
  expect(sourceToggle).toHaveAttribute("aria-expanded", "false");
  await user.click(sourceToggle);
  expect(sourceToggle).toHaveAttribute("aria-expanded", "true");
  expect(within(log).getByText("Open resource")).toBeInTheDocument();
  expect(within(log).getByText("Nothing changes until you confirm.")).toBeInTheDocument();
  expect(within(log).getByText("Try a phishing scenario")).toBeInTheDocument();
  expect(within(log).getByRole("button", { name: /scenario/i })).toBeInTheDocument();
});

test("mobile history drawer closes with Escape and returns focus", async () => {
  const user = userEvent.setup();
  renderCyberGuardPilotFixture({ route: "#/ai-chat", user: authenticatedLearner });
  const trigger = screen.getByRole("button", { name: /open chat history/i });
  await user.click(trigger);
  expect(screen.getByLabelText(/conversation history/i)).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByLabelText(/conversation history/i)).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
```

Exact locale-independent DOM ordering is deferred to Task 6, where the scoped assistant-message subregion attributes are introduced as part of the approved presentation extraction. Task 1 must not add runtime attributes solely for testing.

- [ ] **Step 4: Run focused baseline tests and record current result**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected before implementation: tests that rely on future helper wiring may fail until the helper renders the current app correctly. Record the exact failure in the implementation notes.

- [ ] **Step 5: Complete fixture helper without changing product code**

Mock only the repository-derived modules/functions named in Step 1. Do not mock component behaviour. The helper should make current `App.jsx` render with authenticated route state and fixture chat data.

- [ ] **Step 6: Run focused baseline tests again**

Run the same command. Expected after fixture completion: PASS for current retained behaviours. Quick prompts should be asserted absent only in a test named `baseline does not yet render quick prompts`.

- [ ] **Step 7: Record manual baseline matrix in implementation notes**

Manual matrix for the implementer to execute during later tasks:

| Viewport | Required baseline observation |
|---|---|
| 1440 x 900 | Conversation workspace loads; current hero pushes composer below first screen. |
| 1024 x 768 | No horizontal overflow; composer position recorded. |
| 768 x 1024 | Mobile drawer trigger appears; drawer opens. |
| 430 x 932 | No horizontal overflow; drawer width safe. |
| 390 x 844 | Composer position recorded. |
| 360 x 800 | No horizontal overflow. |
| 320 CSS px | Reflow does not create horizontal scrolling. |
| Mobile landscape | Composer remains reachable or defect is recorded. |

---

## Task 2 — Cyberly Aurora Tokens and Minimal UI Primitives

**Purpose:** Introduce the smallest reusable token and primitive foundation needed by the CyberGuard pilot.

**Files:**

- Create: `client/src/design-system/tokens/cyberlyAurora.css`
- Create: `client/src/design-system/tokens/cyberlyAuroraCss.test.js`
- Create: `client/src/design-system/primitives/Button.jsx`
- Create: `client/src/design-system/primitives/IconButton.jsx`
- Create: `client/src/design-system/primitives/primitives.test.jsx`
- Create: `client/src/cyberguard/cyberguardLayout.css`
- Modify: `client/src/App.jsx` only to import `./design-system/tokens/cyberlyAurora.css` and `./cyberguard/cyberguardLayout.css`

**Interfaces:**

- Consumes: token names defined above.
- Produces: CSS Custom Properties under `.cyberguard-theme`, plus `Button` and `IconButton` primitives for later tasks.

- [ ] **Step 1: Write CSS token tests**

Create `client/src/design-system/tokens/cyberlyAuroraCss.test.js`. Read `cyberlyAurora.css` from disk and assert that approved values are defined only in this CSS token file:

```js
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "cyberlyAurora.css"), "utf8");

test("defines approved Cyberly Aurora tokens once as CSS Custom Properties", () => {
  expect(css).toContain("--cyberly-indigo-600: #5356D9;");
  expect(css).toContain("--cyberly-mint-500: #25BFA2;");
  expect(css).toContain("--cyberly-coral-500: #FF6F61;");
  expect(css).toContain("--cyberly-gold-500: #F5B942;");
  expect(css).toContain("--cyberly-error: #D64550;");
  expect(css.match(/#5356D9/g)).toHaveLength(1);
  expect(css.match(/#FF6F61/g)).toHaveLength(1);
  expect(css.match(/#D64550/g)).toHaveLength(1);
});
```

- [ ] **Step 2: Run token tests to verify failure**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/design-system/tokens/cyberlyAuroraCss.test.js
```

Expected: FAIL because the CSS token file does not exist.

- [ ] **Step 3: Create the single runtime CSS token source**

Create `client/src/design-system/tokens/cyberlyAurora.css`:

```css
.cyberguard-theme {
  --cyberly-indigo-600: #5356D9;
  --cyberly-mint-500: #25BFA2;
  --cyberly-coral-500: #FF6F61;
  --cyberly-gold-500: #F5B942;
  --cyberly-page-bg: #F7F8FC;
  --cyberly-surface-primary: #FFFFFF;
  --cyberly-surface-secondary: #F0F2F8;
  --cyberly-text-primary: #202438;
  --cyberly-text-secondary: #5E6478;
  --cyberly-border-soft: #E2E5EE;
  --cyberly-success: #168A63;
  --cyberly-warning: #C77A12;
  --cyberly-error: #D64550;
  --cyberly-info: #2878C8;
  --cyberly-focus-ring: 0 0 0 3px color-mix(in srgb, var(--cyberly-indigo-600) 22%, transparent);
  --cyberly-radius-control: 10px;
  --cyberly-radius-panel: 16px;
  --cyberly-space-page-gutter: clamp(1rem, 2.5vw, 1.5rem);
  --cyberly-chat-message-max: 680px;
  --cyberly-chat-drawer-width: 340px;
  --cyberly-motion-fast: 160ms;
  --cyberly-motion-panel: 220ms;
}
```

Do not create a JavaScript token module. JavaScript token access is not currently required by the inspected pilot components. If a later implementation proves JS access is required, pause and define a generated or injected access strategy so HEX values still have one manually maintained source.

- [ ] **Step 4: Write primitive tests**

Test semantic output:

```jsx
test("Button preserves semantic disabled and loading behaviour", async () => {
  render(<Button variant="primary">Continue</Button>);
  expect(screen.getByRole("button", { name: "Continue" })).toHaveClass("cy-button");

  const submit = jest.fn();
  render(<Button loading loadingLabel="Saving" onClick={submit}>Save</Button>);
  const saveButton = screen.getByRole("button", { name: /Saving/i });
  expect(saveButton).toHaveAttribute("aria-busy", "true");
  expect(saveButton).toBeDisabled();
  await userEvent.click(saveButton);
  expect(submit).not.toHaveBeenCalled();

  render(<Button disabled loading={false}>Unavailable</Button>);
  expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
});

test("IconButton requires an accessible label", () => {
  render(<IconButton label="Open chat history"><span aria-hidden="true">≡</span></IconButton>);
  expect(screen.getByRole("button", { name: "Open chat history" })).toBeInTheDocument();
});
```

- [ ] **Step 5: Create primitive components**

Implement `Button` and `IconButton` with controlled variants only. `Button` must use `disabled || loading` for the native disabled state, set `aria-busy` when loading, and include visible text for loading state:

```jsx
export default function Button({
  variant = "secondary",
  loading = false,
  loadingLabel = "Loading",
  disabled = false,
  children,
  onClick,
  className = "",
  color,
  tone,
  style,
  ...props
}) {
  const inactive = disabled || loading;
  return (
    <button
      {...props}
      type={props.type || "button"}
      className={`cy-button cy-button-${variant}${loading ? " is-loading" : ""}${className ? ` ${className}` : ""}`}
      aria-busy={loading || undefined}
      disabled={inactive}
      onClick={inactive ? undefined : onClick}
    >
      {loading ? <span>{loadingLabel}</span> : children}
    </button>
  );
}
```

`IconButton` must require a `label`, render a native `button`, and filter `color`, `tone`, and `style` the same way so arbitrary colour props are not public styling APIs. Do not create `Badge`, `Surface`, or `Textarea` in this pilot unless a later task adds a confirmed consumer and updates this plan first.

- [ ] **Step 6: Create pilot layout CSS without repeating HEX tokens**

Create `client/src/cyberguard/cyberguardLayout.css` with primitive and CyberGuard classes that consume variables from `cyberlyAurora.css`. Do not repeat the approved HEX values in this file. Example:

```css
.cy-button-primary {
  background: var(--cyberly-indigo-600);
  color: var(--cyberly-surface-primary);
}

.cy-button:focus-visible,
.cy-icon-button:focus-visible {
  outline: none;
  box-shadow: var(--cyberly-focus-ring);
}
```

- [ ] **Step 7: Import pilot CSS**

Modify `client/src/App.jsx` near existing imports:

```js
import "./design-system/tokens/cyberlyAurora.css";
import "./cyberguard/cyberguardLayout.css";
```

Do not remove current `globalStyle` yet.

- [ ] **Step 8: Run focused tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/design-system/tokens/cyberlyAuroraCss.test.js src/design-system/primitives/primitives.test.jsx
```

Expected: PASS.

---

## Task 3 — Compact Workspace Header and AI Transparency Notice

**Purpose:** Replace the current large dark-gradient hero with a compact workspace header and visible AI transparency notice.

**Files:**

- Create: `client/src/cyberguard/WorkspaceHeader.jsx`
- Create: `client/src/cyberguard/AIContentNotice.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/ms.json`
- Modify: `client/src/i18n/locales/zh-CN.json`
- Test: `client/src/cyberguard/CyberGuardPilot.test.jsx`

**Interfaces:**

- Consumes: `Button` from Task 2.
- Produces: compact header and notice used by `AIChatPage`.

- [ ] **Step 1: Write failing header and notice tests**

Extend `CyberGuardPilot.test.jsx`:

```jsx
test("CyberGuard pilot header removes old AI Gateway wording and shows AI notice", () => {
  renderCyberGuardPilotFixture({ route: "#/ai-chat", user: authenticatedLearner });
  expect(screen.queryByText(/AI Gateway phase/i)).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /CyberGuard/i })).toBeInTheDocument();
  expect(screen.getByText(/may make mistakes/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused test and confirm failure**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: FAIL because the current hero still contains old copy and no new notice.

- [ ] **Step 3: Add translation keys**

Add the exact keys listed in this plan under `chat.pilot` in all three locale files. Initial English copy:

```json
"pilot": {
  "header": {
    "kicker": "CyberGuard",
    "title": "CyberGuard",
    "description": "Ask focused cyber-wellness questions, review safer next steps, and keep learning at your pace.",
    "currentConversation": "Current chat"
  },
  "notice": {
    "title": "AI-supported guidance",
    "description": "CyberGuard may make mistakes. Check important information with trusted sources or a trusted adult."
  }
}
```

Malay and Chinese wording must follow existing locale style and keep interpolation keys identical.

- [ ] **Step 4: Create `WorkspaceHeader`**

Implement:

```jsx
export default function WorkspaceHeader({ title, description, conversationTitle, updatedLabel, onNewChat, newChatLabel }) {
  return (
    <header className="cyberguard-workspace-header">
      <div className="cyberguard-workspace-copy">
        <p className="cyberguard-kicker">{title}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="cyberguard-workspace-current" aria-label={conversationTitle}>
        <strong>{conversationTitle}</strong>
        {updatedLabel && <span>{updatedLabel}</span>}
      </div>
      <Button variant="secondary" onClick={onNewChat}>{newChatLabel}</Button>
    </header>
  );
}
```

- [ ] **Step 5: Create `AIContentNotice`**

Implement:

```jsx
import { useId } from "react";

export default function AIContentNotice({ title, description }) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <aside
      className="cyberguard-ai-notice"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <strong id={titleId}>{title}</strong>
      <span id={descriptionId}>{description}</span>
    </aside>
  );
}
```

This persistent notice is informational and must not use `role="alert"`. Keep failed generation messages as `role="alert"`.

- [ ] **Step 6: Replace current AIChatPage hero block**

In `client/src/App.jsx`, replace the block that starts with:

```jsx
<div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)"
```

with:

```jsx
<div className="cyberguard-theme cyberguard-page">
  <WorkspaceHeader
    title={t("chat.pilot.header.title")}
    description={t("chat.pilot.header.description")}
    conversationTitle={activeConversation?.title || t("chat.conversation.newTitle")}
    updatedLabel={activeConversation ? t("chat.history.lastUpdated", { time: formatChatUpdatedAt(activeConversation.updatedAt, t) }) : t("chat.history.noActive")}
    onNewChat={handleCreateConversation}
    newChatLabel={t("chat.actions.newChat")}
  />
  <AIContentNotice title={t("chat.pilot.notice.title")} description={t("chat.pilot.notice.description")} />
  ...
</div>
```

Keep the existing `ai-chat-shell` inside the page wrapper. Remove the duplicate New Chat button from the inner main header only after tests verify a replacement exists.

- [ ] **Step 7: Style compact header and notice**

Before adding replacement CSS, identify the old inline hero block and old related selectors (`.ai-chat-shell`, `.ai-chat-main-header`) that the new header affects. In `cyberguardLayout.css`, add `.cyberguard-page`, `.cyberguard-workspace-header`, `.cyberguard-ai-notice`, and responsive wrapping. Keep the notice compact. Remove the old inline hero block in the same task. Retain `.ai-chat-main-header` only until Task 4 confirms whether it is still needed for the conversation-title row.

- [ ] **Step 8: Run locale verification**

Run:

```powershell
node scripts/verify-locales.js
```

Expected: PASS.

- [ ] **Step 9: Run focused tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: PASS.

---

## Task 4 — Chat Shell Height and Scrolling Model

**Purpose:** Ensure the conversation and composer are visible in the first screen at common viewport heights.

**Files:**

- Create: `client/src/cyberguard/ChatShell.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/cyberguard/cyberguardLayout.css`
- Test: `client/src/cyberguard/CyberGuardPilot.test.jsx`

**Interfaces:**

- Consumes: `WorkspaceHeader`, `AIContentNotice`.
- Produces: `.cyberguard-shell`, `.cyberguard-main`, `.cyberguard-messages`, `.cyberguard-composer` class structure.

**CSS migration rules for this task:**

- Verify the existing navigation-height variable before naming it. Current inspection shows `--nav-h` in `client/src/App.jsx`; re-check before implementation because this plan is documentation.
- Identify old selectors `.ai-chat-shell`, `.ai-chat-main`, `.ai-chat-full-messages`, `.ai-chat-drawer-layer`, `.chat-panel`, and `.chat-messages` before adding replacement selectors.
- Remove CyberGuard-owned fixed-height rules after `.cyberguard-*` classes own the behaviour.
- Preserve shared `.chat-*` selectors only while the dashboard preview or floating widget still consumes them.
- Do not use `!important`.

- [ ] **Step 1: Write DOM-structure tests**

Create these extraction-safety tests:

```jsx
test("CyberGuard shell exposes independent message and composer regions", () => {
  renderCyberGuardPilotFixture({ route: "#/ai-chat", user: authenticatedLearner });
  expect(screen.getByRole("log", { name: /chat message history/i }).closest(".cyberguard-messages")).toBeTruthy();
  expect(screen.getByLabelText(/type your chat message/i).closest(".cyberguard-composer")).toBeTruthy();
});
```

- [ ] **Step 2: Run focused test and confirm failure**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: FAIL because new shell classes do not exist.

- [ ] **Step 3: Create `ChatShell`**

Implement:

```jsx
export default function ChatShell({ sidebar, main, drawer, drawerOpen }) {
  return (
    <div className={`cyberguard-shell${drawerOpen ? " drawer-open" : ""}`}>
      {sidebar}
      {main}
      {drawer}
    </div>
  );
}
```

- [ ] **Step 4: Wire shell classes in App.jsx**

Keep existing `aside`, `section`, `ChatMessageList`, and `ChatComposer` logic. Add compatibility class names:

```jsx
<div className={`ai-chat-shell cyberguard-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
...
<section className="ai-chat-main cyberguard-main" ...>
...
<ChatMessageList className="ai-chat-full-messages cyberguard-messages" />
<div className="cyberguard-composer"><ChatComposer /></div>
```

If wrapping `ChatComposer` changes layout, instead pass `className="cyberguard-composer"` to `ChatComposer` after updating the component signature to `function ChatComposer({ compact = false, className = "" })`.

- [ ] **Step 5: Replace fixed-height shell CSS with grid-owned remaining height**

Use the page grid's remaining row instead of estimating header and notice height with fixed subtraction. In `cyberguardLayout.css`, add:

```css
.cyberguard-page {
  min-height: calc(100vh - var(--nav-h));
  min-height: calc(100dvh - var(--nav-h));
  background: var(--cyberly-page-bg);
  color: var(--cyberly-text-primary);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: hidden;
}

.cyberguard-shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 0 var(--cyberly-space-page-gutter) var(--cyberly-space-page-gutter);
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 1rem;
  overflow: hidden;
}

.cyberguard-main {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cyberguard-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.cyberguard-composer {
  flex: 0 0 auto;
}
```

Do not add JavaScript viewport measurement. The compact header and notice occupy automatic grid rows, and the chat workspace occupies `minmax(0, 1fr)`.

- [ ] **Step 6: Add mobile and landscape CSS**

Add:

```css
@media (max-width: 820px) {
  .cyberguard-page {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .cyberguard-shell {
    grid-template-columns: 1fr;
    min-height: 0;
    padding-bottom: max(var(--cyberly-space-page-gutter), env(safe-area-inset-bottom));
    overflow: hidden;
  }

  .cyberguard-main {
    min-height: 0;
  }
}

@media (max-height: 560px) {
  .cyberguard-workspace-header {
    padding-block: 0.6rem;
  }

  .cyberguard-ai-notice {
    padding-block: 0.5rem;
  }
}
```

Add a low-height fallback that keeps the composer reachable:

```css
@media (max-height: 520px) {
  .cyberguard-page {
    overflow: auto;
  }

  .cyberguard-shell {
    min-height: 420px;
  }
}
```

Account for the existing mobile bottom navigation and safe areas by testing `env(safe-area-inset-bottom)` padding and confirming the composer is not hidden behind fixed UI.

- [ ] **Step 7: Run focused tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: PASS.

- [ ] **Step 8: Manual computed-layout acceptance**

Run the app locally only during implementation:

```powershell
npm run dev
```

Record for each required viewport:

- Composer top/bottom.
- Message-region top/bottom.
- `document.documentElement.scrollWidth <= window.innerWidth`.
- Whether composer is usable without initial page scrolling where physically possible.
- Whether footer is outside the task workspace and does not consume chat height.

---

## Task 5 — First-Use Empty State, Quick Prompts, and Learner-Friendly Error

**Purpose:** Replace broad first-use copy, introduce non-sending quick prompts, and convert raw provider wording into learner-facing error copy.

**Files:**

- Create: `client/src/cyberguard/ChatEmptyState.jsx`
- Create: `client/src/cyberguard/QuickPrompt.jsx`
- Create: `client/src/cyberguard/ChatErrorState.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/ms.json`
- Modify: `client/src/i18n/locales/zh-CN.json`
- Test: `client/src/cyberguard/CyberGuardPilot.test.jsx`

**Interfaces:**

- Consumes: `Button`.
- Produces: `ChatEmptyState({ compact, onPromptSelect })`, `QuickPrompt({ label, prompt, onSelect })`, `ChatErrorState({ message, onRetry, retryLabel })`.
- Composer strategy: preserve current local `ChatComposer` ownership and add a narrow draft-request interface. Current inspection shows `ChatComposer` owns `input`, clears only after `sendMessage(text)` returns `ok`, and keeps text after failure while returning focus. This is the smallest safe change because it avoids moving chat state into `AIChatPage` and avoids changing compact-widget send timing.

- [ ] **Step 1: Write failing empty-state tests**

Add:

```jsx
test("empty state is bounded and quick prompts fill composer without sending", async () => {
  const user = userEvent.setup();
  const sendSpy = jest.fn();
  renderCyberGuardPilotFixture({ route: "#/ai-chat", user: authenticatedLearner, sendSpy });
  expect(screen.queryByText(/Ask CyberGuard anything/i)).not.toBeInTheDocument();
  const prompt = screen.getByRole("button", { name: /What should I learn next/i });
  await user.click(prompt);
  expect(screen.getByLabelText(/type your chat message/i)).toHaveValue("What should I learn next?");
  expect(sendSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Write failing error-copy test**

Add:

```jsx
test("failed generation shows learner-facing copy and keeps alert semantics", () => {
  renderCyberGuardPilotFixture({
    route: "#/ai-chat",
    user: authenticatedLearner,
    generation: { status: "failed", error: "AI provider request failed." },
  });
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent(/CyberGuard could not prepare a reply/i);
  expect(alert).not.toHaveTextContent(/AI provider request failed/i);
});
```

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: FAIL because current empty/error presentation has old wording and no prompt-fill behaviour.

- [ ] **Step 4: Add translation keys**

Add:

```json
"empty": {
  "title": "Start with one safe cyber step",
  "description": "Ask about scams, passwords, privacy, misinformation, online safety, or your next Cyberly learning step.",
  "promptNext": "What should I learn next?",
  "promptExplainIssue": "Explain a recent cyber-safety issue.",
  "promptInstruction": "Choose a prompt to place it in the message box."
},
"error": {
  "title": "CyberGuard could not prepare a reply.",
  "provider": "Something interrupted the AI reply. You can retry, or ask a shorter cyber-wellness question.",
  "retry": "Retry reply"
}
```

Place these under `chat.pilot`.

- [ ] **Step 5: Update ChatComposer with a narrow draft-request interface**

Change signature:

```jsx
function ChatComposer({ compact = false, className = "", draftRequest = null, onDraftAccepted })
```

Keep local state ownership:

```jsx
const [input, setInput] = useState("");
const lastDraftRequestIdRef = useRef(null);

useEffect(() => {
  if (!draftRequest?.requestId) return;
  if (lastDraftRequestIdRef.current === draftRequest.requestId) return;
  lastDraftRequestIdRef.current = draftRequest.requestId;
  setInput(draftRequest.text || "");
  onDraftAccepted?.(draftRequest.requestId);
}, [draftRequest, onDraftAccepted]);
```

Rules:

- `ChatComposer` owns input state in both full-page and compact-widget usage.
- Quick prompt selection passes `{ text, requestId }` to the full-page composer only.
- A new `requestId` fills the input and never sends automatically.
- Enter and send button behaviour remain unchanged.
- Successful send clears input exactly as current code does.
- Failed send keeps input and returns focus exactly as current code does.
- The compact widget uses its own local `ChatComposer compact` state and does not receive full-page quick-prompt draft requests.

- [ ] **Step 6: Create empty and quick prompt components**

`ChatEmptyState` renders one or two quick prompt buttons. `QuickPrompt` calls `onSelect({ text: prompt, requestId })`, where `requestId` is a new string for each click, and never calls `sendMessage`. Tests must verify quick-prompt click fills the composer but does not call `sendMessage`, `createChatUserMessage`, or `generateChatAssistantReply`.

- [ ] **Step 7: Create error component**

`ChatErrorState` receives raw error but maps provider-like raw messages to `chat.pilot.error.provider`. Preserve `role="alert"` in the containing failed-generation element.

- [ ] **Step 8: Wire into `ChatMessageList` and `AIChatPage`**

Replace the empty branch at current `messages.length === 0` with `ChatEmptyState`. Replace failed generation display message with `ChatErrorState` inside the existing `role="alert"` container.

- [ ] **Step 9: Run locale verification**

Run:

```powershell
node scripts/verify-locales.js
```

Expected: PASS.

- [ ] **Step 10: Run focused tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: PASS.

---

## Task 6 — Message, Source, Action, and Proposal Presentation Extraction

**Purpose:** Extract CyberGuard message presentation while preserving behaviour and data contracts.

**Files:**

- Create: `client/src/cyberguard/ChatMessage.jsx`
- Create: `client/src/cyberguard/SourceSummary.jsx`
- Create: `client/src/cyberguard/ActionCard.jsx`
- Create: `client/src/cyberguard/ProposalCard.jsx`
- Modify: `client/src/App.jsx`
- Test: `client/src/cyberguard/CyberGuardPilot.test.jsx`
- Retain: `client/src/chat/chatActions.js`

**Interfaces:**

- Consumes: existing `message`, `source`, `action`, and `proposal` shapes.
- Produces: presentation components that keep current ordering and safety behaviour.

**CSS migration rules for this task:**

- Identify old selectors `.chat-bubble`, `.chat-markdown`, `.chat-source-*`, `.chat-action-card*`, and `.chat-action-proposal*` before adding replacements.
- Preserve existing selectors as compatibility selectors only when the floating widget or dashboard preview still consumes them.
- Remove CyberGuard-only duplicates in the same task once extracted components own the presentation.
- Do not use `!important`.
- Add scoped `data-testid` only for `chat-message-answer-*`, `chat-message-sources-*`, `chat-message-proposal-*`, and `chat-message-actions-*`.
- These IDs are introduced in this task only, as part of the presentation extraction, because Task 1 intentionally does not modify runtime code.

- [ ] **Step 1: Write the failing structural-order test**

At the beginning of Task 6, add this test before extraction:

```jsx
test("assistant message regions keep answer, sources, proposal, actions order", () => {
  renderCyberGuardPilotFixture({
    route: "#/ai-chat",
    user: authenticatedLearner,
    messages: [{ id: 21, role: "user", text: "Help" }, assistantMessageWithEverything],
  });
  const log = screen.getByRole("log", { name: /chat message history/i });
  const answer = within(log).getByTestId("chat-message-answer-22");
  const sources = within(log).getByTestId("chat-message-sources-22");
  const proposal = within(log).getByTestId("chat-message-proposal-22");
  const actions = within(log).getByTestId("chat-message-actions-22");

  expect(answer.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(sources.compareDocumentPosition(proposal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(proposal.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
```

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: FAIL because the approved scoped assistant-message regions do not exist yet.

- [ ] **Step 2: Create these extraction-safety tests**

Create:

```jsx
test("source links remain safe and source expansion is keyboard reachable", async () => {
  const user = userEvent.setup();
  renderCyberGuardPilotFixture({
    route: "#/ai-chat",
    user: authenticatedLearner,
    messages: [{ id: 21, role: "user", text: "Help" }, assistantMessageWithEverything],
  });
  const toggle = screen.getByRole("button", { name: /show sources/i });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: /external/i })).toHaveAttribute("rel", "noopener noreferrer");
});
```

Create:

```jsx
test("proposal copy keeps confirmation required before action cards", () => {
  renderCyberGuardPilotFixture({
    route: "#/ai-chat",
    user: authenticatedLearner,
    messages: [{ id: 21, role: "user", text: "Help" }, assistantMessageWithEverything],
  });
  expect(screen.getByText(/Nothing changes until you confirm/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run focused tests before extraction**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: the new structural-order test FAILS because the scoped region attributes do not exist yet; the source/proposal safety tests should pass if they match current semantics.

- [ ] **Step 4: Extract `ChatMessage`**

Move only bubble rendering and Markdown rendering from `ChatMessageList`. Keep `ChatMarkdown` import/definition accessible. If `ChatMarkdown` remains in `App.jsx`, pass rendered children into `ChatMessage`; otherwise move `ChatMarkdown` into `client/src/cyberguard/ChatMessage.jsx` with no behaviour change. Add `data-testid={regionTestId}` to the assistant answer region only when `regionTestId` is provided.

- [ ] **Step 5: Extract `SourceSummary`**

Move `truncateSourceSnippet`, `sourceSummaryText`, `ChatSourceItem`, and `ChatSourceGroup` presentation into `SourceSummary.jsx`. Pass `onOpenInternalTarget` from `App.jsx` or keep `useApp()` only if the component remains app-bound. Add `data-testid={regionTestId}` to the source group wrapper only when `regionTestId` is provided. Preserve:

- `target="_blank"`.
- `rel="noopener noreferrer"`.
- `aria-expanded`.
- compact mode summary.

- [ ] **Step 6: Extract `ProposalCard`**

Move `ChatMessageProposal` presentation and state into `ProposalCard.jsx`. Add `data-testid={regionTestId}` to the proposal wrapper only when `regionTestId` is provided. Preserve:

- confirmation token remains internal to the component props from mapped server data.
- no parameters are rendered.
- confirmation invokes existing `confirmLearnerActionProposal`.
- cancellation invokes existing `cancelLearnerActionProposal`.
- completed navigation uses existing safe target helpers.

- [ ] **Step 7: Extract `ActionCard`**

Move `ChatActionCard` and `ChatActionGroup` into `ActionCard.jsx`. Add `data-testid={regionTestId}` to the group wrapper only when `regionTestId` is provided. Preserve:

- `resolveChatActionTarget`.
- `buildProposalPayloadForChatAction`.
- `dedupeActionsAgainstProposal`.
- disabled unavailable state.
- existing proposal review flow.

- [ ] **Step 8: Wire extracted components into `ChatMessageList`**

`ChatMessageList` should still own iteration and generation status placement. It should render:

```jsx
<ChatMessage message={message} regionTestId={`chat-message-answer-${message.id}`} />
<SourceSummary sources={message.sources || []} compact={emptyCompact} regionTestId={`chat-message-sources-${message.id}`} />
<ProposalCard proposal={message.proposal || null} regionTestId={`chat-message-proposal-${message.id}`} />
<ActionCardGroup actions={dedupeActionsAgainstProposal(...)} compact={emptyCompact} regionTestId={`chat-message-actions-${message.id}`} />
```

Export `ActionCard` and a named `ActionCardGroup` from `client/src/cyberguard/ActionCard.jsx`. This keeps the action presentation in one file while avoiding a component namespace pattern that is uncommon elsewhere in this codebase.

- [ ] **Step 9: Run focused tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx src/chat/chatActions.test.js
```

Expected: PASS.

---

## Task 7 — Floating Widget as Lightweight Companion Preview

**Purpose:** Reduce the floating widget from a compact full transcript into a lightweight companion preview while preserving route behaviour.

**Files:**

- Create: `client/src/cyberguard/ChatWidgetPreview.jsx`
- Create: `client/src/cyberguard/ChatWidgetPreview.test.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/ms.json`
- Modify: `client/src/i18n/locales/zh-CN.json`
- Test: `client/src/cyberguard/ChatWidgetPreview.test.jsx`

**Interfaces:**

- Consumes: current `ChatWidget` open/close state, current user, `go`, custom hash-route shape, and recent chat state from `useChat`.
- Produces: lightweight widget preview with deterministic recent-context rule.

**CSS migration rules for this task:**

- Identify old selectors `.chat-fab`, `.chat-panel`, `.chat-header`, `.chat-header-button`, `.chat-messages`, and `.chat-login-prompt` before adding replacements.
- Preserve shared `.chat-*` selectors only if `DashboardChatPreview` still uses them after Task 6.
- Remove widget-owned duplicate selectors after `ChatWidgetPreview` owns the preview.
- Do not use `!important`.

- [ ] **Step 1: Choose deterministic context rule**

Use this rule:

- Show at most the latest two visible messages.
- For each message, render at most 180 characters.
- Hide sources, proposals, and action cards in the widget preview; show a compact line that full details are available on the CyberGuard page.
- Keep composer visible for authenticated learners.

Justification: runtime audit showed the current widget tries to show the long transcript and becomes dense on `390 x 844`; two short messages preserve context without competing with the full page.

- [ ] **Step 2: Write widget tests**

Create:

```jsx
test("floating widget has accessible launcher and hides on full chat route", () => {
  renderCyberGuardPilotFixture({ route: "#/dashboard", user: authenticatedLearner });
  expect(screen.getByRole("button", { name: /open chat widget/i })).toBeInTheDocument();
  cleanup();
  renderCyberGuardPilotFixture({ route: "#/ai-chat", user: authenticatedLearner });
  expect(screen.queryByRole("button", { name: /open chat widget/i })).not.toBeInTheDocument();
});

test("widget preview limits recent context and links to full page", async () => {
  const user = userEvent.setup();
  renderCyberGuardPilotFixture({
    route: "#/dashboard",
    user: authenticatedLearner,
    messages: [
      { id: 1, role: "user", text: "one" },
      { id: 2, role: "ai", text: "two" },
      { id: 3, role: "user", text: "three" },
    ],
  });
  await user.click(screen.getByRole("button", { name: /open chat widget/i }));
  expect(screen.queryByText("one")).not.toBeInTheDocument();
  expect(screen.getByText("two")).toBeInTheDocument();
  expect(screen.getByText("three")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /open cyberguard full page/i })).toHaveAttribute("href", "#/ai-chat");
});
```

- [ ] **Step 3: Run widget tests and confirm failure**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/ChatWidgetPreview.test.jsx
```

Expected: FAIL because the new preview component does not exist.

- [ ] **Step 4: Add widget locale keys**

Use the `chat.pilot.widget.*` keys listed earlier. Ensure "Open CyberGuard full page" has Malay and Chinese translations.

- [ ] **Step 5: Create `ChatWidgetPreview`**

Implement with:

- Accessible launcher name.
- Non-emoji-only primary identity. Use a simple CSS-backed shield/avatar mark with `aria-hidden="true"` and visible "CyberGuard" text.
- Close button with accessible name.
- Full-page semantic link with accessible name "Open CyberGuard full page.".
- Two-message preview.
- Existing `ChatComposer compact` when authenticated.

Use an anchor for full-page navigation:

```jsx
<a
  className="cyberguard-widget-full-link"
  href={user ? "#/ai-chat" : "#/login"}
  onClick={event => {
    event.preventDefault();
    onOpenFullPage();
  }}
  aria-label={openFullPageLabel}
>
  {openFullPageLabel}
</a>
```

This matches the current custom hash-routing architecture while preserving link semantics. Do not use an ordinary `Button` for this navigation unless implementation proves the activity-guard route abstraction cannot be reached from an anchor click; if that happens, document the reason in the implementation report.

- [ ] **Step 6: Wire into `ChatWidget`**

Replace the internal panel JSX of `ChatWidget` with `ChatWidgetPreview`. Keep:

- `open` state.
- `setOpen`.
- `openFullPage`.
- `page !== "ai-chat"` hiding rule in `App`.

- [ ] **Step 7: Style widget preview**

Use CSS from `cyberguardLayout.css`:

- Width remains safe at mobile widths.
- Panel avoids horizontal overflow.
- Preview message region has bounded height.
- Full transcript details are directed to full page.

- [ ] **Step 8: Run focused tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/ChatWidgetPreview.test.jsx src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: PASS.

---

## Task 8 — Final Responsive, Accessibility, and Multilingual Acceptance

**Purpose:** Verify the pilot without adding unrelated features.

**Files:**

- Modify: none unless a verified pilot defect is found.
- Verify: all files touched by Tasks 1-7.

**Interfaces:**

- Consumes: completed pilot implementation.
- Produces: acceptance evidence for the pilot.

- [ ] **Step 1: Run focused frontend tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx src/cyberguard/ChatWidgetPreview.test.jsx src/design-system/tokens/cyberlyAuroraCss.test.js src/design-system/primitives/primitives.test.jsx src/chat/chatActions.test.js src/chat/chatApi.test.js
```

Expected: PASS.

- [ ] **Step 2: Run full frontend tests**

Run:

```powershell
npm --prefix client test -- --watchAll=false
```

Expected: PASS. If CRA watch behaviour differs in PowerShell, rerun with:

```powershell
$env:CI = "true"
npm --prefix client test -- --watchAll=false
Remove-Item Env:CI
```

Always remove `Env:CI` after the command.

- [ ] **Step 3: Run locale verification**

Run:

```powershell
node scripts/verify-locales.js
```

Expected: PASS.

- [ ] **Step 4: Run builds**

Run:

```powershell
npm --prefix client run build
npm run build
```

Expected: PASS.

- [ ] **Step 5: Manual browser acceptance by viewport**

Run:

```powershell
npm run dev
```

Check:

| Viewport | Acceptance |
|---|---|
| 1440 x 900 | Header, notice, conversation, and composer visible without initial page scrolling. |
| 1024 x 768 | Composer usable; no horizontal overflow. |
| 768 x 1024 | Mobile drawer path works; composer usable. |
| 430 x 932 | Header and notice do not crowd the composer. |
| 390 x 844 | Widget and full page do not overflow horizontally. |
| 360 x 800 | Widget remains usable and composer reachable. |
| 320 CSS px | Reflow has no horizontal scroll. |
| Mobile landscape | Composer remains reachable; message area remains usable. |

- [ ] **Step 6: Manual browser acceptance by language**

Check English, Bahasa Melayu, and Simplified Chinese:

- Header title and description.
- AI notice.
- Empty state.
- Quick prompt labels.
- Error state.
- Widget title and full-page action.
- Long Malay labels wrap safely.
- Historical mixed-language messages remain readable.

- [ ] **Step 7: Manual accessibility acceptance**

Check:

- Keyboard navigation reaches header actions, drawer trigger, message list controls, source toggle, proposal controls, action card controls, composer, and widget controls.
- Visible focus is present.
- Drawer opens and Escape closes it.
- Focus returns to drawer trigger.
- Source expansion toggles with keyboard and updates `aria-expanded`.
- 200% zoom remains usable.
- Reduced motion disables nonessential movement.
- No colour-only status.
- Icon buttons have accessible names.
- Composer remains usable with short viewport.
- Screen-reader testing is recorded as a manual follow-up if unavailable.

- [ ] **Step 8: Manual state acceptance**

Check:

- Unauthenticated redirect.
- Authenticated empty state.
- Active conversation.
- Long Markdown answer fixture.
- Sources collapsed and expanded.
- Action card.
- Proposal card.
- Loading state.
- Provider failure state.
- Floating widget.
- Long Malay copy.
- Mixed-language historical messages.

- [ ] **Step 9: Final static checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; status only includes intentional pilot files.

## Specification Coverage Map

- Large dark-gradient hero removed or reduced: Task 3.
- AI Gateway wording replaced: Task 3.
- Conversation and composer first-screen visibility: Task 4 and Task 8.
- AI-may-make-mistakes notice: Task 3.
- Empty state no longer says "Ask CyberGuard anything": Task 5.
- One or two quick prompts fill composer before sending: Task 5.
- Drawer Escape and focus return retained: Task 1, Task 4, Task 8.
- `role="log"` and `aria-live` retained: Task 1, Task 6, Task 8.
- Markdown rendering retained: Task 1, Task 6.
- Compact source expansion retained: Task 1, Task 6.
- Source/proposal/action presence and current semantics baseline: Task 1.
- Exact locale-independent source/proposal/action DOM ordering: Task 6.
- Final source/proposal/action ordering acceptance: Task 8.
- Floating widget compact and usable on mobile: Task 7, Task 8.
- No API/database/provider/safety-boundary change: Global constraints and all tasks.
- No full `App.jsx` rewrite: App extraction boundary and all tasks.

## Test Strategy

Automated tests protect structure, semantics, ordering, i18n keys, and component contracts. Browser acceptance validates layout geometry, scrolling, zoom, and responsive behaviour that JSDOM cannot prove. Physical-device and screen-reader acceptance are recorded separately when unavailable.

## Deferred Work

- Provider reliability.
- Prompt tolerance and classifier work.
- Backend API changes.
- Database changes.
- Agentic execution changes.
- Sound implementation.
- Full design-system rollout across non-CyberGuard pages.
- Full `App.jsx` decomposition.
- Tamil locale implementation.
