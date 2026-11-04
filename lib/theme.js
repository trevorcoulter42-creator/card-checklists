// CardHQ design tokens — "Cobalt" palette and type scale from the CardHQ Site Audit.
// Type follows Command Center: Chakra Petch for everything (text, numbers, tracked
// eyebrow labels); Michroma only for page titles (every h1 — see THEME_CSS in app/layout.js).
// Inter 800 is kept for the CardHQ logo wordmark only.

// Type system:
//   Chakra Petch  400 body · 500 UI · 600 emphasis, eyebrows, nav · 700 big numbers
//   Michroma      page titles (h1), upper-case and tracked
//   Sizes: 12 · 13 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · display clamp
// Colour
export const BG = 'var(--hq-bg)'          // page background (navy-black, not pure black)
export const SURFACE = 'var(--hq-surface)'     // cards, inputs, chips
export const SURFACE_2 = 'var(--hq-surface-2)'   // raised / hover / skeleton
export const LINE = 'var(--hq-line)'        // hairlines and default borders
export const CHIP_LINE = 'var(--hq-chip-line)'   // accent-tinted outline (chips, focus)
export const TEXT = '#EDEDEF'        // primary text
export const TEXT_2 = '#A1A1AA'      // secondary text
export const LABEL = '#8A93A8'       // labels, captions, meta
export const ACCENT = '#3B6EF5'      // fills: buttons, active chips, bars
export const ACCENT_TEXT = '#7FA2FF' // accent used as text / links / numbers on dark

// Type
// Command Center type: Chakra Petch for everything; Michroma only for page titles (h1, set in layout.js CSS).
export const SANS = "'Chakra Petch', system-ui, sans-serif"
export const DISPLAY_FONT = "'Chakra Petch', system-ui, sans-serif"
export const TITLE_FONT = "'Michroma', 'Chakra Petch', sans-serif"
// Display: hero + page titles + stat numbers. Uppercase, condensed, heavy.
export const display = { fontFamily: DISPLAY_FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1 }
// Eyebrow: small tracked labels above content ("BASEBALL · 2024", "SETS INDEXED").
export const eyebrow = { fontFamily: DISPLAY_FONT, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', lineHeight: 1.2 }
// Title: section headings and card titles. Mixed case Inter.
export const title = (size = 22) => ({ fontFamily: SANS, fontSize: size, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, textTransform: 'none' })
// Button text.
export const buttonText = { fontFamily: SANS, fontWeight: 600, letterSpacing: '0', textTransform: 'none' }
