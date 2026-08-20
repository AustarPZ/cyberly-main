const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "cyberguardLayout.css");
const appPath = path.join(__dirname, "..", "App.jsx");
const css = fs.readFileSync(cssPath, "utf8");
const appSource = fs.readFileSync(appPath, "utf8");

function blockFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match ? match[1] : "";
}

function mediaBlockFor(mediaQuery, selector) {
  const mediaIndex = css.indexOf(mediaQuery);
  if (mediaIndex === -1) return "";
  const nextMediaIndex = css.indexOf("@media", mediaIndex + mediaQuery.length);
  const mediaBody = css.slice(mediaIndex, nextMediaIndex === -1 ? css.length : nextMediaIndex);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = mediaBody.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match ? match[1] : "";
}

function zIndexFor(selector) {
  const match = blockFor(selector).match(/z-index\s*:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

describe("CyberGuard Task 4 layout CSS", () => {
  test("defines controlled chat shell selectors", () => {
    [
      ".cyberguard-page",
      ".cyberguard-chat-shell",
      ".cyberguard-chat-shell.is-sidebar-collapsed",
      ".cyberguard-chat-shell-sidebar",
      ".cyberguard-chat-shell-main",
      ".cyberguard-chat-shell-messages",
      ".cyberguard-chat-shell-composer",
    ].forEach(selector => {
      expect(css).toContain(selector);
    });
  });

  test("uses grid-safe columns and shrink-safe regions", () => {
    expect(blockFor(".cyberguard-chat-shell")).toMatch(/grid-template-columns\s*:/);
    expect(blockFor(".cyberguard-chat-shell")).toMatch(/minmax\(0,\s*1fr\)/);
    expect(blockFor(".cyberguard-chat-shell")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-chat-shell-sidebar")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-chat-shell-main")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-chat-shell-messages")).toMatch(/min-width\s*:\s*0/);
  });

  test("uses viewport-aware bounded panel sizing without locking the route page", () => {
    expect(blockFor(".cyberguard-page")).toMatch(/height\s*:\s*auto/);
    expect(css).toMatch(/@media\s*\(max-width:\s*820px\)/);
    expect(css).toMatch(/\.cyberguard-chat-shell\s*\{[\s\S]*?grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
    expect(blockFor(".cyberguard-chat-shell")).toMatch(/height\s*:\s*clamp\(/);
  });

  test("lets the full-page route use natural document flow instead of a locked viewport", () => {
    const page = blockFor(".cyberguard-page");
    const routeWrap = appSource.match(/\.page-wrap\.cyberguard-page-wrap\s*\{([\s\S]*?)\}/m)?.[1] || "";

    expect(routeWrap).toMatch(/(?:^|\n)\s*height\s*:\s*auto/);
    expect(routeWrap).toMatch(/(?:^|\n)\s*overflow\s*:\s*visible/);
    expect(routeWrap).not.toMatch(/(?:^|\n)\s*height\s*:\s*calc\(100(?:d)?vh\s*-\s*var\(--nav-h\)\)/);
    expect(routeWrap).not.toMatch(/overflow\s*:\s*hidden/);

    expect(page).not.toMatch(/(?:^|\n)\s*height\s*:\s*calc\(100dvh\s*-\s*var\(--nav-h\)\)/);
    expect(page).toMatch(/(?:^|\n)\s*height\s*:\s*auto/);
    expect(page).toMatch(/(?:^|\n)\s*min-height\s*:\s*0/);
    expect(page).toMatch(/(?:^|\n)\s*max-height\s*:\s*none/);
    expect(page).toMatch(/overflow\s*:\s*visible/);
    expect(page).not.toMatch(/overflow-x\s*:\s*(?:hidden|clip|auto|scroll)/);
    expect(page).not.toMatch(/grid-template-rows\s*:\s*auto auto minmax\(0,\s*1fr\)/);
    expect(page).toMatch(/grid-template-rows\s*:\s*auto auto auto/);
    expect(blockFor(".cyberguard-chat-shell")).toMatch(/min-height\s*:/);
    expect(blockFor(".cyberguard-chat-shell-main > .ai-chat-main")).toMatch(/grid-template-rows\s*:\s*minmax\(0,\s*1fr\)\s+auto/);
  });

  test("bounds the desktop ChatShell so messages cannot grow the document", () => {
    const shell = blockFor(".cyberguard-chat-shell");
    expect(shell).toMatch(/height\s*:\s*clamp\(/);
    expect(shell).not.toMatch(/height\s*:\s*100%/);
    expect(shell).not.toMatch(/max-height\s*:\s*100%/);
    expect(shell).toMatch(/min-height\s*:\s*0/);
    expect(shell).toMatch(/overflow\s*:\s*hidden/);
    expect(shell).not.toMatch(/min-height\s*:\s*min\(58rem/);
    expect(shell).not.toMatch(/height\s*:\s*\d+px/);
  });

  test("keeps sidebar and conversation history independently scrollable", () => {
    expect(blockFor(".cyberguard-chat-shell-sidebar")).toMatch(/height\s*:\s*100%/);
    expect(blockFor(".cyberguard-chat-shell-sidebar")).toMatch(/overflow\s*:\s*hidden/);
    expect(blockFor(".cyberguard-chat-shell-sidebar > .ai-chat-sidebar")).toMatch(/height\s*:\s*100%/);
    expect(blockFor(".cyberguard-chat-shell-sidebar > .ai-chat-sidebar")).toMatch(/overflow\s*:\s*hidden/);
    expect(blockFor(".ai-chat-history-search")).toMatch(/flex\s*:\s*0 0 auto/);
    expect(blockFor(".cyberguard-chat-shell-sidebar .ai-chat-list")).toMatch(/overflow-y\s*:\s*auto/);
    expect(blockFor(".cyberguard-chat-shell-sidebar .ai-chat-list")).toMatch(/overflow-x\s*:\s*hidden/);
  });

  test("keeps conversation search responsive without taking list scroll ownership", () => {
    expect(blockFor(".ai-chat-history-search")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".ai-chat-history-search-row")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".ai-chat-history-search-input")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".ai-chat-history-search-input")).toMatch(/min-height\s*:\s*40px/);
    expect(blockFor(".ai-chat-history-search-clear")).toMatch(/min-height\s*:\s*40px/);
    expect(blockFor(".ai-chat-history-no-results")).toMatch(/overflow-wrap\s*:\s*anywhere/);
    expect(css).not.toMatch(/#5356D9|#25BFA2|#FF6F61|#F5B942|#D64550/);
  });

  test("keeps conversation date groups scoped, compact, and inside the scroll list", () => {
    expect(blockFor(".ai-chat-history-group")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".ai-chat-history-group")).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
    expect(blockFor(".ai-chat-history-group-heading")).toMatch(/color\s*:\s*var\(--cyberly-text-secondary\)/);
    expect(blockFor(".ai-chat-history-group-heading")).toMatch(/font-size\s*:/);
    expect(blockFor(".ai-chat-history-group-heading")).toMatch(/overflow-wrap\s*:\s*anywhere/);
    expect(blockFor(".ai-chat-history-group-list")).toMatch(/display\s*:\s*grid/);
    expect(blockFor(".ai-chat-history-group-list")).toMatch(/gap\s*:/);
    expect(css).not.toMatch(/(?:^|\n)\s*h[1-6]\s*\{/);
    expect(css).not.toMatch(/!important/);
  });

  test("keeps collapsible conversation group controls scoped and token-based", () => {
    expect(blockFor(".ai-chat-history-group-control")).toMatch(/min-width\s*:\s*36px/);
    expect(blockFor(".ai-chat-history-group-control")).toMatch(/min-height\s*:\s*36px/);
    expect(blockFor(".ai-chat-history-group-control")).toMatch(/background\s*:\s*transparent/);
    expect(blockFor(".ai-chat-history-group-control")).toMatch(/color\s*:\s*var\(--cyberly-text-secondary\)/);
    expect(blockFor(".ai-chat-history-group-control")).toMatch(/cursor\s*:\s*pointer/);
    expect(css).toMatch(/\.ai-chat-history-group-control:focus-visible\s*\{[\s\S]*?box-shadow\s*:\s*var\(--cyberly-focus-ring\)/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/width\s*:\s*0\.(?:6|65|7|75)rem/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/height\s*:\s*0\.(?:6|65|7|75)rem/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/display\s*:\s*inline-block/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/flex\s*:\s*0 0 auto/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/border-right\s*:\s*2px solid currentColor/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/border-bottom\s*:\s*2px solid currentColor/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/transform\s*:\s*rotate\(-45deg\)/);
    expect(blockFor(".ai-chat-history-group-chevron")).toMatch(/transition\s*:\s*transform var\(--cyberly-motion-fast\) ease/);
    expect(blockFor(".ai-chat-history-group-chevron.is-expanded")).toMatch(/transform\s*:\s*rotate\(45deg\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.ai-chat-history-group-chevron\s*\{[\s\S]*?transition\s*:\s*none/);
    expect(blockFor(".ai-chat-history-group-list.is-collapsed")).toMatch(/display\s*:\s*none/);
    expect(blockFor(".ai-chat-history-group-control")).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
    expect(blockFor(".ai-chat-history-group-list.is-collapsed")).not.toMatch(/overflow-y\s*:\s*auto/);
    expect(appSource).toContain('className={`ai-chat-history-group-chevron${');
    expect(appSource).not.toContain('{groupExpanded ? "⌄" : "›"}');
    expect(css).not.toMatch(/content\s*:\s*["'](?:⌄|›|>|v)["']/);
    expect(css).not.toMatch(/(?:^|\n)\s*button\s*\{/);
    expect(css).not.toMatch(/!important/);
    expect(css).not.toMatch(/#5356D9|#25BFA2|#FF6F61|#F5B942|#D64550/);
  });

  test("suppresses only the native search decorations while preserving the custom clear button", () => {
    expect(css).toContain(".ai-chat-history-search-input::-webkit-search-cancel-button");
    expect(css).toContain(".ai-chat-history-search-input::-webkit-search-decoration");
    expect(css).toMatch(/\.ai-chat-history-search-input::-webkit-search-cancel-button,[\s\S]*?\.ai-chat-history-search-input::-webkit-search-decoration\s*\{[\s\S]*?appearance\s*:\s*none/);
    expect(css).toMatch(/\.ai-chat-history-search-input::-webkit-search-cancel-button,[\s\S]*?\.ai-chat-history-search-input::-webkit-search-decoration\s*\{[\s\S]*?-webkit-appearance\s*:\s*none/);
    expect(css).toContain(".ai-chat-history-search-clear");
    expect(css).not.toMatch(/input\[type=["']search["']\]::-webkit-search/);
    expect(css).not.toMatch(/!important/);
  });

  test("keeps the message log as the independent vertical scroll owner", () => {
    const messages = blockFor(".cyberguard-chat-shell-messages");
    expect(messages).toMatch(/min-height\s*:\s*0/);
    expect(messages).toMatch(/overflow-y\s*:\s*auto/);
    expect(messages).toMatch(/overflow-x\s*:\s*hidden/);
    expect(messages).toMatch(/overscroll-behavior\s*:\s*contain/);
    expect(blockFor(".cyberguard-chat-shell-composer")).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
  });

  test("allows mobile page flow and avoids the unsafe short-viewport floor", () => {
    const mobilePage = mediaBlockFor("@media (max-width: 820px)", ".cyberguard-page");
    const mobileMain = mediaBlockFor("@media (max-width: 820px)", ".cyberguard-chat-shell-main");

    expect(mobilePage).toMatch(/height\s*:\s*auto/);
    expect(mobilePage).toMatch(/overflow\s*:\s*visible/);
    expect(mobilePage).not.toMatch(/overflow-x\s*:\s*(?:hidden|clip|auto|scroll)/);
    expect(mobilePage).toMatch(/grid-template-rows\s*:\s*auto auto auto/);
    expect(mobileMain).toMatch(/height\s*:\s*clamp\(24rem,\s*68dvh,\s*44rem\)/);
    expect(mobileMain).toMatch(/min-height\s*:\s*0/);
    expect(css).not.toMatch(/height\s*:\s*clamp\(28rem,\s*68dvh,\s*42rem\)/);
  });

  test("adds a short-height mobile rule that reduces the conversation panel", () => {
    const shortMain = mediaBlockFor(
      "@media (max-width: 820px) and (max-height: 760px)",
      ".cyberguard-chat-shell-main"
    );

    expect(css).toContain("@media (max-width: 820px) and (max-height: 760px)");
    expect(shortMain).toMatch(/height\s*:\s*clamp\(20rem,\s*62dvh,\s*34rem\)/);
    expect(shortMain).toMatch(/min-height\s*:\s*0/);
  });

  test("assigns overflow ownership to the message region", () => {
    expect(blockFor(".cyberguard-chat-shell-main")).toMatch(/overflow\s*:\s*hidden/);
    expect(blockFor(".cyberguard-chat-shell-messages")).toMatch(/overflow-y\s*:\s*auto/);
    expect(blockFor(".cyberguard-chat-shell-messages")).toMatch(/overflow-x\s*:\s*hidden/);
    expect(blockFor(".cyberguard-chat-shell-composer")).not.toMatch(/position\s*:\s*fixed/);
    expect(blockFor(".cyberguard-chat-shell")).not.toMatch(/position\s*:\s*fixed/);
  });

  test("hides the workspace history control on desktop and restores it for drawer layouts", () => {
    expect(blockFor(".cyberguard-workspace-history-control")).toMatch(/display\s*:\s*none/);
    expect(mediaBlockFor("@media (max-width: 820px)", ".cyberguard-workspace-history-control")).toMatch(/display\s*:\s*inline-flex/);
  });

  test("keeps drawer selectors while avoiding prohibited Task 4 CSS patterns", () => {
    expect(css).toContain(".ai-chat-drawer-layer");
    expect(css).toContain(".ai-chat-drawer");
    expect(css).not.toMatch(/!important/);
    expect(css).not.toMatch(/#5356D9|#25BFA2|#FF6F61|#F5B942|#D64550/);
    expect(blockFor(".cyberguard-chat-shell-main")).not.toMatch(/width\s*:\s*\d+px/);
  });

  test("places the export dialog layer above the mobile drawer without broad overrides", () => {
    expect(css).toContain(".cyberguard-export-dialog-layer");
    expect(zIndexFor(".ai-chat-drawer-layer")).toBeGreaterThan(0);
    expect(zIndexFor(".cyberguard-export-dialog-layer")).toBeGreaterThan(zIndexFor(".ai-chat-drawer-layer"));
    expect(blockFor(".cyberguard-export-dialog-layer")).toMatch(/z-index\s*:\s*\d+/);
    expect(blockFor(".cyberguard-export-dialog-layer")).not.toMatch(/!important/);
    expect(css).not.toMatch(/#5356D9|#25BFA2|#FF6F61|#F5B942|#D64550/);
  });
});

describe("CyberGuard Task 5 empty state and composer CSS", () => {
  test("defines scoped empty-state, prompt, and composer selectors", () => {
    [
      ".cyberguard-empty-state",
      ".cyberguard-empty-state-copy",
      ".cyberguard-empty-state-title",
      ".cyberguard-empty-state-description",
      ".cyberguard-quick-prompts",
      ".cyberguard-quick-prompt",
      ".cyberguard-composer-frame",
      ".cyberguard-composer-main",
      ".cyberguard-composer-guidance",
      ".cyberguard-composer-status",
    ].forEach(selector => {
      expect(css).toContain(selector);
    });
  });

  test("keeps empty state readable without fixed-height layout", () => {
    const emptyState = blockFor(".cyberguard-empty-state");
    expect(emptyState).toMatch(/width\s*:\s*min\(/);
    expect(emptyState).toMatch(/max-width\s*:/);
    expect(emptyState).toMatch(/margin\s*:\s*0 auto auto/);
    expect(emptyState).not.toMatch(/height\s*:/);
    expect(emptyState).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
  });

  test("lays out quick prompts as wrapping accessible buttons", () => {
    const promptList = blockFor(".cyberguard-quick-prompts");
    const promptButton = blockFor(".cyberguard-quick-prompt");
    expect(promptList).toMatch(/grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(promptButton).toMatch(/min-height\s*:\s*44px/);
    expect(promptButton).toMatch(/background\s*:\s*var\(--cyberly-surface-primary\)/);
    expect(promptButton).toMatch(/border\s*:\s*1px solid var\(--cyberly-border-soft\)/);
    expect(promptButton).toMatch(/text-align\s*:\s*left/);
    expect(promptButton).not.toMatch(/width\s*:\s*\d+px/);
  });

  test("keeps composer frame shrink-safe and non-fixed", () => {
    expect(blockFor(".cyberguard-composer-frame")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-composer-main")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-composer-main")).toMatch(/grid-template-columns\s*:/);
    expect(css).toMatch(/\.cyberguard-composer-main\s+\.chat-input\s*\{[\s\S]*?min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-composer-frame")).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
    expect(blockFor(".cyberguard-composer-main")).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
  });

  test("stacks prompts and composer safely on mobile", () => {
    const mobilePrompts = mediaBlockFor("@media (max-width: 820px)", ".cyberguard-quick-prompts");
    const mobileComposer = mediaBlockFor("@media (max-width: 820px)", ".cyberguard-composer-main");
    expect(mobilePrompts).toMatch(/grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
    expect(mobileComposer).toMatch(/grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
  });

  test("avoids broad selectors and prohibited CSS patterns", () => {
    expect(css).not.toMatch(/!important/);
    expect(css).not.toMatch(/#5356D9|#25BFA2|#FF6F61|#F5B942|#D64550/);
    expect(css).not.toMatch(/(?:^|\n)\s*(?:textarea|form|button)\s*\{/);
    expect(blockFor(".cyberguard-chat-shell-composer")).not.toMatch(/position\s*:\s*(?:fixed|sticky)/);
  });
});

describe("CyberGuard final visual alignment CSS", () => {
  test("uses a compact token-based trusted companion identity", () => {
    expect(blockFor(".cyberguard-workspace-identity-mark")).toMatch(/background\s*:\s*var\(--cyberly-surface-secondary\)/);
    expect(blockFor(".cyberguard-workspace-identity-mark")).toMatch(/color\s*:\s*var\(--cyberly-indigo-600\)/);
    expect(blockFor(".cyberguard-workspace-copy")).toMatch(/display\s*:\s*grid/);
    expect(blockFor(".cyberguard-workspace-copy")).not.toMatch(/min-height\s*:\s*\d+px/);
    expect(blockFor(".cyberguard-page")).not.toMatch(/linear-gradient/);
  });

  test("scopes the final conversation, evidence, action, and proposal hierarchy", () => {
    [
      ".cyberguard-chat-shell-messages .chat-bubble.user",
      ".cyberguard-chat-shell-messages .chat-bubble.ai",
      ".cyberguard-assistant-message-sources .chat-source-group",
      ".cyberguard-assistant-message-actions .chat-action-card",
      ".cyberguard-assistant-message-proposal .chat-action-proposal",
      ".cyberguard-composer-frame .chat-input",
      ".cyberguard-composer-frame .chat-send",
    ].forEach(selector => expect(css).toContain(selector));

    expect(blockFor(".cyberguard-assistant-message-sources .chat-source-group")).toMatch(/border-left\s*:\s*3px solid var\(--cyberly-mint-500\)/);
    expect(blockFor(".cyberguard-assistant-message-actions .chat-action-card")).toMatch(/border-left\s*:\s*3px solid var\(--cyberly-gold-500\)/);
    expect(blockFor(".cyberguard-assistant-message-proposal .chat-action-proposal")).toMatch(/border-left\s*:\s*3px solid var\(--cyberly-indigo-600\)/);
  });

  test("keeps final alignment shrink-safe, locally scrollable, and reduced-motion aware", () => {
    expect(blockFor(".cyberguard-assistant-message")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".cyberguard-assistant-message .chat-markdown pre")).toMatch(/overflow-x\s*:\s*auto/);
    expect(blockFor(".cyberguard-assistant-message .chat-table-wrap")).toMatch(/overflow-x\s*:\s*auto/);
    expect(blockFor(".cyberguard-composer-frame .chat-input")).toMatch(/min-width\s*:\s*0/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.cyberguard-quick-prompt/);
    expect(css).not.toMatch(/body\s*\{[\s\S]*?overflow-x\s*:\s*hidden/);
    expect(css).not.toMatch(/!important/);
  });
});
