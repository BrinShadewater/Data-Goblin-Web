// Design tokens — Data Goblin field guide.
// Warm parchment + deep goblin green + charcoal ink, per the design plan.
// Dark mode = deep navy-charcoal (#080c12 family), per the mockup App shell.

import type { ReaderMode } from "./pagination";

export const DISPLAY = "'Playfair Display', Georgia, serif";
export const BODY = "'Source Serif 4', Georgia, serif";
/** Dyslexia-friendly reading face (goblin-reading-mode = "dyslexic"). */
export const BODY_DYS = "'Atkinson Hyperlegible', Verdana, sans-serif";
export const MONO = "'JetBrains Mono', 'Courier New', monospace";
export const UI = "'Inter', sans-serif";
export const HAND = "'Caveat', cursive";

export const RADIUS = "2px";

/** Palette pairs consumed via ThemeContext's c(light, dark) helper. */
export const P = {
  // Surfaces
  appBg: ["#d8d2c4", "#080c12"],
  panelBg: ["#ece5d3", "#10141c"],
  panelBgAlt: ["#f2ece0", "#0d1018"],
  pageBg: ["#faf8f0", "#161a24"],
  pageBgAlt: ["#f5f0e4", "#141822"],
  cardBg: ["#fffdf6", "#141720"],
  inputBg: ["#f0ece2", "#1a1d28"],

  // Ink
  ink: ["#23211a", "#c8c2b0"],
  /** Full-contrast title ink for chapter openers (item: header readability). */
  titleInk: ["#16140e", "#ece6d4"],
  body: ["#2e2b20", "#bfb9a8"],
  muted: ["#7c7460", "#5d6878"],
  faint: ["#9a9080", "#46505e"],

  // Accents
  green: ["#2d5a27", "#74b85e"],
  greenDeep: ["#1f4a1a", "#5aaa3a"],
  greenBg: ["#e9f0dc", "#13200f"],
  greenBorder: ["#a8c388", "#2a4830"],
  navy: ["#1a2e4a", "#7ab4e8"],
  navyDeep: ["#12233a", "#9cc8f0"],
  navyBg: ["#e8edf4", "#13202e"],
  red: ["#a8321f", "#e06848"],
  amber: ["#9a6510", "#d9a23f"],
  amberBg: ["#fbf2e0", "#211a10"],
  amberBorder: ["#dfb778", "#54401e"],

  // Rules
  border: ["#c9bfa6", "#222837"],
  borderSoft: ["#ddd5c0", "#1c2230"],
} as const;

export type PairKey = keyof typeof P;

// ---------------------------------------------------------------------------
// Reader type scale — sizes depend on the viewport mode and the
// dyslexia-friendly reading mode. All values in px unless noted.
// ---------------------------------------------------------------------------

export interface TypeScale {
  /** Body face: Source Serif normally, Atkinson Hyperlegible in dyslexic mode. */
  bodyFont: string;
  body: number;
  bodyLh: number;
  letterSpacing: string;
  wordSpacing: string;
  /** Dyslexic mode renders body italics as regular type. */
  italicsOff: boolean;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  /** Section heading inside the book page. */
  section: number;
  openerTitle: number;
  openerSub: number;
  /** Goblin Check / Recap / Trap body text. */
  callout: number;
  small: number;
  table: number;
}

export function typeScale(mode: ReaderMode, dyslexic: boolean): TypeScale {
  const body = mode === "tablet" ? 16.5 : 16;
  return {
    bodyFont: dyslexic ? BODY_DYS : BODY,
    body,
    bodyLh: dyslexic ? 1.8 : 1.65,
    letterSpacing: dyslexic ? "0.02em" : "normal",
    wordSpacing: dyslexic ? "0.08em" : "normal",
    italicsOff: dyslexic,
    h1: 26,
    h2: 21,
    h3: 18,
    h4: 14,
    section: mode === "phone" ? 19 : 20.5,
    openerTitle: mode === "phone" ? 28 : 34,
    openerSub: mode === "phone" ? 16 : 17.5,
    callout: body - 0.5,
    small: 12.5,
    table: 14,
  };
}
