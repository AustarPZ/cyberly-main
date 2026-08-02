# Visual Language

**Status:** Approved target foundation for Cyberly Public Beta 0.9
**Implementation status:** Not fully implemented

## Experience Balance

Cyberly should feel 75% Digital Companion and 25% Cyber Adventure. The interface should be calm, supportive, and clear, with enough exploration energy to make learning feel active.

## Cyberly Aurora Palette

The following values are approved initial target tokens subject to visual prototype and accessibility validation. They are target values, not verified runtime facts. Do not claim these values are currently implemented until runtime code and visual verification prove it.

Brand:

- Cyber Indigo 600: `#5356D9` for identity, major headers, active navigation, and primary emphasis.
- Digital Mint 500: `#25BFA2` for supportive guidance, safe progress, and companion surfaces.
- Explorer Coral 500: `#FF6F61` for important prompts, caution accents, and human warmth.
- Achievement Gold 500: `#F5B942` for meaningful milestones and completion moments.

Neutral:

- Page Background: `#F7F8FC`.
- Surface Primary: `#FFFFFF`.
- Surface Secondary: `#F0F2F8`.
- Text Primary: `#202438`.
- Text Secondary: `#5E6478`.
- Border Soft: `#E2E5EE`.

Functional status colours must remain separate from brand colours:

- Success: `#168A63` for completed or confirmed safe action.
- Warning: `#C77A12` for review, caution, or attention.
- Error: `#D64550` for failed, blocked, or unsafe action.
- Information: `#2878C8` for neutral guidance.

Do not use page-specific arbitrary brand colours. A page may choose emphasis from approved roles, but it should not invent a separate palette.

## Colour Restrictions

- Do not communicate important information through colour alone.
- Keep text contrast accessible on all surfaces.
- Use accent colours sparingly.
- Reserve Achievement Gold for real milestones, not every positive state.
- Explorer Coral must not be used as the error colour.
- Keep brand colours separate from functional status colours.
- Keep AI risk, refusal, and error states visually clear without alarming learners.

## Neutral Surfaces

Use soft neutral surfaces for reading and task areas. Surfaces should separate content from background without heavy borders or visual noise.

Recommended surface categories:

- Page background.
- Raised panel.
- Reading card.
- Task card.
- Inline notice.
- Modal/dialog surface.

## Typography and Multilingual Fallback

Approved target typography:

- English and Bahasa Melayu: Plus Jakarta Sans.
- Simplified and Traditional Chinese: Noto Sans SC / TC.
- Future Tamil support: Noto Sans Tamil.

The runtime does not yet implement all target typography. Future layout must allow longer Malay labels and future Tamil line lengths.

## Shape and Radius

Use soft-rounded shapes, not exaggerated pill shapes everywhere.

Target guidance:

- Small controls: modest radius.
- Cards and panels: soft radius.
- Chat bubbles: rounded but compact.
- Modals and drawers: consistent panel radius.

Avoid mixing many unrelated radii in one page.

## Card Categories

Cards should have a clear purpose:

- Learning card: resource or lesson content.
- Practice card: scenario action.
- Progress card: learner state or milestone.
- Evidence card: source or citation metadata.
- Proposal card: learner-controlled action confirmation.
- Admin card: governance status or review task.

Sources should look like evidence, not primary action cards.

## Background Categories

Use purpose-based backgrounds:

- Calm learning background.
- Focused task background.
- Workspace background for chat/admin.
- Milestone background for meaningful completion.

Do not use decorative backgrounds that reduce readability.

## Page-Header Categories

Use purpose-based headers instead of a universal banner:

- Compact header: routine pages and returning workflows.
- Contextual hero: orientation or first-time learning moments.
- Task header: assessment, scenario, and focused practice.
- Workspace header: CyberGuard and Admin.
- No banner: dense tool surfaces when a header would reduce usable space.

## Illustration Guidance

Use editorial youth illustration with soft digital accents. Illustrations should support understanding or emotional tone. Avoid stereotyping Malaysian learners by ethnicity, clothing, location, or culture.

## Icon-System Guidance

Use consistent icons for navigation, action, status, evidence, and AI notices. Icons should not replace accessible labels. Avoid random emoji as the primary product icon system in production UI.

## Accessibility Requirements for Colour

Every colour-coded state needs text, icon, shape, or label support. Focus states must remain visible in all themes and at 200% zoom.
