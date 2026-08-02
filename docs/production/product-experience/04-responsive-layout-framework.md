# Responsive Layout Framework

**Status:** Approved target foundation for Cyberly Public Beta 0.9
**Implementation status:** Not fully implemented

## Responsive Goals

Cyberly should work well on desktop and mobile web. The target is mobile-first, task-based adaptation with functional parity across major routes.

Minimum targets:

- 320 CSS px reflow.
- 200% zoom support.
- Desktop and mobile access to the same core tasks.
- No horizontal scrolling for standard learner workflows.

## Breakpoint Ranges

Approved target ranges:

- Compact mobile: 320-389px.
- Standard mobile: 390-479px.
- Large mobile / small tablet: 480-767px.
- Tablet: 768-1023px.
- Desktop: 1024-1439px.
- Wide desktop: 1440px and above.

Exact breakpoints can be adjusted after implementation evidence.

## Container Types

- Standard content: approximately 1280px maximum width.
- Reading content: approximately 720px maximum width.
- Task content: approximately 640px maximum width.
- Workspace content: wider layouts for CyberGuard and Admin when useful.

## Page Gutters

Use responsive page gutters that protect small screens and avoid excessive whitespace on desktop. Gutters should be consistent across pages unless a task surface needs a specific workspace layout.

## Grid Strategy

Prefer grids that collapse predictably:

- Multi-column desktop cards become one column on mobile.
- Sidebars become drawers, stacked sections, or summary panels.
- Tables become card lists or horizontally managed regions only when data requires it.

## Card Reflow Rules

Cards must not depend on fixed desktop widths. Long labels, Malay text, Chinese text, future Tamil text, and dynamic AI output must wrap safely.

## Vertical Spacing

Use spacing to make tasks scannable. Avoid large fixed hero regions on task pages when they push the main workflow below the first screen.

## Navigation

Use three navigation levels:

- Global navigation: app-wide route access.
- Section navigation: within large domains such as Dashboard or Admin.
- Local navigation: tabs, drawers, and step navigation inside a workflow.

Desktop should use global top navigation. Mobile should use mobile-appropriate navigation, including bottom navigation where approved.

## Page-Header Responsive Behaviour

Headers must match page purpose:

- Compact header for routine pages.
- Contextual hero for orientation.
- Task header for assessment and scenarios.
- Workspace header for CyberGuard and Admin.
- No banner for dense tools when a banner reduces usability.

## Page Frameworks

Dashboard: overview, current next step, progress, and quick access. Avoid forcing long scrolling before the main recommendation.

Assessment: focused task flow with clear progress, question context, and review-safe feedback.

Scenario: immersive but readable practice flow. Controls must remain reachable on mobile.

Resources and Malaysia Guide: reading-first layout with filters that collapse cleanly. Malaysia-specific guidance must keep source transparency.

CyberGuard: workspace layout. The conversation, composer, AI transparency notice, and current task should be visible without a large hero pushing them away.

Profile and Settings: form-first layout with clear save state and accessible validation.

Admin: workspace layout for governance tasks. Dense information is allowed, but it must remain responsive and role-safe.

Footer: should not reduce task workspace height on pages such as CyberGuard.

## Viewport Verification Matrix

Future pilot implementation should verify at least:

- 1440 x 900.
- 1024 x 768.
- 768 x 1024.
- 430 x 932.
- 390 x 844.
- 360 x 800.
- 320 CSS px reflow.
- One mobile landscape viewport.

## Prohibited Fixed-Layout Patterns

- Fixed-height chat workspaces that hide the composer on common screens.
- Fixed-width cards that overflow mobile.
- Hover-only controls.
- Modals that cannot scroll.
- Tables without mobile fallback.
- Page-wide hero banners on task surfaces where they push the task below the first screen.
