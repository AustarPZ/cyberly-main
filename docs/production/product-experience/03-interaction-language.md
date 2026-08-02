# Interaction Language

**Status:** Approved target foundation for Cyberly Public Beta 0.9
**Implementation status:** Not fully implemented

## Interaction Personality

Cyberly interactions should be responsive, supportive, and calm. The product should guide learners toward progress without pressure. Feedback should explain what changed and what can happen next.

## Motion Hierarchy

Motion is functional first:

1. State change: a panel opens, a message arrives, a section expands.
2. Learning explanation: progress updates, scenario outcome, route step transition.
3. Celebration: meaningful milestones only.

Motion should be short and purposeful. Suggested target durations:

- Micro feedback: 120-180ms.
- Panel or drawer transition: 180-240ms.
- Learning transition: 240-320ms.
- Celebration: short, optional, and non-blocking.

Exact values may change after prototype validation.

## Button States

Buttons must communicate:

- Default.
- Hover where hover exists.
- Focus-visible.
- Pressed or active.
- Loading.
- Disabled.
- Confirmed or completed where relevant.

Important state must not rely on colour alone.

## Loading Behaviour

Loading should be honest and bounded. Use clear labels such as "Preparing your reply" or "Loading progress." Avoid implying that a task has completed before it has.

For CyberGuard, preserve answer visibility while retrying or recovering from a failed generation.

## Assessment Feedback

Assessment feedback should help learners understand strengths and support areas. It must not shame learners or present the result as a fixed identity.

## Scenario Feedback

Scenario feedback should explain the consequence of a choice, identify safer alternatives, and encourage replay when useful. Avoid punitive copy.

## Progress Feedback

Progress should show movement over time and encourage continued learning. It should not frame incomplete areas as failure.

## CyberGuard Interaction Behaviour

CyberGuard should:

- Stay clearly bounded to cyber wellness learning.
- Explain uncertainty and AI limitations.
- Offer concise next steps.
- Keep sources, follow-up actions, and proposals visually distinct.
- Never claim an action happened unless the backend confirmed it.
- Keep learner-controlled proposals explicit and reversible where supported.

## Background Music and Sound

No automatic background music on first visit. Sound must be optional, user-controlled, and never required to understand feedback.

Background music and basic sound effects are optional P1 enhancements for Cyberly Public Beta 0.9. They are not part of the current CyberGuard frontend pilot and may only be implemented through a separately approved scoped phase.

If a later Public Beta 0.9 audio phase is approved:

- Music must be opt-in or explicitly enabled by the user.
- Settings must support music on/off and sound-effects on/off.
- Volume controls may be included in that scoped phase.
- Sound and motion must never be the only method of communicating information.
- The interface must remain fully usable with all sound disabled.

## Reduced Motion

Respect reduced-motion preferences. Provide non-motion alternatives for transitions, loading, success, and warnings.

## Mobile Interaction Principles

- Primary actions should remain reachable with one hand where practical.
- Avoid hover-only interactions.
- Keep drawers and modals dismissible by clear controls.
- Preserve mobile and desktop functional parity.
- Ensure the composer remains usable when the viewport is short.

## No-Motion and No-Sound Information Rule

No important information may be communicated through colour, sound, or motion alone.

## Optional Public Beta 0.9 Enhancements Outside the CyberGuard Pilot

The following may be considered for Public Beta 0.9 only through a separate approved phase:

- Opt-in background music.
- Basic sound effects.
- Music on/off and sound-effects on/off settings.
- Volume controls.

These are not currently implemented and are not included in the CyberGuard pilot.

## Deferred Beyond Public Beta 0.9

The following interaction ideas remain deferred beyond Public Beta 0.9 unless a later product decision changes the release scope:

- Page-specific music.
- Complex audio systems.
- Voice interaction.
- Automatic playback.
- Complex gamified animation systems.
- Full avatar animation.
- Gesture-only interactions.
- Uncontrolled AI-generated UI actions.
