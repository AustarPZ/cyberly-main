# Cyberly Product-Experience Foundation

**Status:** Proposed and approved foundation for Cyberly Public Beta 0.9
**Release target:** Controlled Public Beta, target date 2026-10-03
**Implementation status:** Not fully implemented; subject to current-system audit

This folder defines the product-experience direction for Cyberly Public Beta 0.9. It translates the completed frontend static audit and CyberGuard runtime audit into durable guidance for future learner-facing UI work.

Documentation here is not runtime code. A rule in this folder is implemented only after source code changes, verification evidence, and review confirm it.

## Document Hierarchy

- `01-brand-foundation.md`: why Cyberly exists, who it serves, and how the product should sound and feel.
- `02-visual-language.md`: colour, typography, shape, illustration, icon, and page-header direction.
- `03-interaction-language.md`: motion, feedback, loading, sound, and interaction rules.
- `04-responsive-layout-framework.md`: mobile-first layout, containers, navigation, reflow, and viewport verification.
- `05-component-system.md`: target component layers, component requirements, and anti-patterns.
- `pilots/cyberguard-public-beta-pilot.md`: precise pilot specification for the first Public Beta 0.9 UI implementation.

## Precedence Rules

1. User instructions for the active task take precedence.
2. Root `AGENTS.md` and local `AGENTS.md` files define working rules.
3. This product-experience foundation defines approved target experience.
4. Pilot specifications define scoped implementation direction for a chosen surface.
5. Implementation plans break pilot work into executable phases.
6. Runtime code and tests remain the source of truth for what currently exists.

If a product-experience document conflicts with verified runtime behaviour, treat the document as target direction and record the gap instead of claiming the runtime already matches it.

## How Future Developers Should Use This Folder

- Read the relevant general document before learner-facing UI work.
- Read the relevant pilot specification before implementing pilot changes.
- Keep implementation changes narrow and evidence-based.
- Do not duplicate these rules into new documents unless a specific phase needs an implementation plan.
- Clearly distinguish approved target, verified current fact, and proposed future work in new documentation.

## Scope Boundaries

Project instructions tell Codex and developers how to work. Product-experience specifications define the intended learner experience. Pilot specifications define a narrow implementation target. Implementation plans define step-by-step work. Runtime code determines what is currently shipped.

Documentation does not by itself prove implementation.
