# Component System

**Status:** Approved target foundation for Cyberly Public Beta 0.9
**Implementation status:** Not fully implemented

This document defines the target component direction. It does not imply that all listed components currently exist.

## Component Layers

1. UI primitives: buttons, links, inputs, labels, icons, surfaces, layout helpers.
2. Shared product components: page headers, notices, cards, dialogs, drawers, toasts, loading states.
3. Domain components: CyberGuard, learning, scenario, content, admin, progress.
4. Page compositions: route-level assemblies of domain components.

## Recommended Future Frontend Structure

Future frontend work should gradually move reusable UI from large page files into focused modules. Avoid a full rewrite. Extract only when a component has a clear purpose, stable props, and verification coverage.

## Controlled Variants

Components should support controlled variants such as `primary`, `secondary`, `quiet`, `danger`, or `evidence`. Avoid excessive boolean props that create unclear combinations.

Prefer composition over a large `UniversalCard` component.

## Semantic HTML First

Use native HTML semantics before custom behaviour:

- `button` for actions.
- `a` for navigation.
- `form`, `label`, and input associations for forms.
- `dialog` or accessible dialog patterns for modal interactions.
- Proper headings and landmarks for page structure.

## Core Component Requirements

Button: clear variants, loading state, disabled state, focus-visible state, touch-friendly sizing.

Link: visible destination intent, safe external-link handling, no fake links for actions.

Form: labels, validation messages, save state, error recovery, no hint-only labels.

Card: purpose-specific variants for learning, practice, progress, evidence, proposal, and admin.

Badge: short status label, not the only state indicator.

Alert: semantic role, clear severity, actionable recovery where useful.

Dialog: focus management, Escape behaviour where safe, clear confirm/cancel actions.

Tabs: keyboard support and visible selected state.

Progress: explain what is measured and avoid punitive language.

Empty State: explain what is missing and provide one clear next action.

Loading: communicate what is loading without blocking unrelated content.

Toast: transient feedback only; do not use for critical information that disappears.

Avatar: optional identity support, not required for comprehension.

Audio Control: no autoplay; visible controls; captions or text equivalent when needed.

AI Notice: persistent enough to be noticed; explains AI limitations without overwhelming the task.

## Domain Components

CyberGuard:

- ChatShell.
- ConversationList.
- ChatMessage.
- ChatComposer.
- QuickPrompt.
- SourceSummary.
- ActionCard.
- ProposalCard.
- AIContentNotice.

Learning:

- LearningStepCard.
- RecommendationCard.
- ProgressSummary.
- ReflectionPrompt.

Scenario:

- ScenarioCard.
- ScenarioStep.
- DecisionOption.
- ScenarioFeedback.
- ScenarioResultSummary.

Content:

- ResourceCard.
- ResourceFilter.
- SourceMetadata.
- ReadingPanel.

Admin:

- GovernanceStatusCard.
- ReviewQueueItem.
- MetadataSummary.
- AuditNotice.

## Component Documentation Requirements

Each shared component should document:

- Purpose.
- Allowed variants.
- Accessibility expectations.
- Responsive behaviour.
- i18n considerations.
- Known restrictions.

## Public Beta Component Priority

1. CyberGuard workspace components.
2. Shared Button, IconButton, Badge, Card, Alert, Drawer, Dialog, Loading, Empty State.
3. AIContentNotice and SourceSummary.
4. Recommendation and Scenario cards.
5. Admin governance cards.

## Anti-Patterns

- Universal components with many boolean props.
- Large arbitrary inline-style blocks for new UI.
- Page-specific colour systems.
- Duplicated button/card styles.
- Icon-only controls without accessible names.
- Components that hide backend or safety state from the learner.
