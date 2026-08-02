# Cyberly Frontend Rules

## Product-Experience References

- Before learner-facing UI work, read the relevant files in `docs/production/product-experience/`.
- For CyberGuard pilot work, read `docs/production/product-experience/pilots/cyberguard-public-beta-pilot.md`.
- Treat those documents as approved target direction, not proof of current implementation.

## Frontend Scope Rules

- Preserve functional behaviour unless the requested phase explicitly changes it.
- Do not change backend contracts during frontend-only tasks unless explicitly approved.
- Keep mobile and desktop behaviour in scope for learner-facing changes.
- Test English, Bahasa Melayu, and Simplified Chinese layout when UI copy changes.
- Future Tamil expansion must not be blocked by fixed widths or typography choices.

## UI Rules

- Use approved tokens and components when they exist.
- Avoid page-specific arbitrary design language.
- Avoid new large inline-style blocks.
- Do not create universal components with excessive boolean props.
- Prefer semantic HTML before custom interaction patterns.
- Preserve keyboard, focus, aria-live, drawer, dialog, and reduced-motion behaviour.
- No autoplay music.
- Do not communicate important information through colour, sound, or motion alone.
- All new learner-facing text must use i18n.
- AI output must remain clearly labelled and must not expose private learner data.

## Workflow Rules

- Inspect package scripts before running tests or builds.
- Report commands, results, changed files, and unresolved risks.
