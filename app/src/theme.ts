// Design tokens — Data Goblin field guide.
// Warm parchment + deep goblin green + charcoal ink, per the design plan.
// Dark mode = deep navy-charcoal (#080c12 family), per the mockup App shell.

export const DISPLAY = "'Playfair Display', Georgia, serif";
export const BODY = "'Source Serif 4', Georgia, serif";
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
  body: ["#2e2b20", "#bfb9a8"],
  muted: ["#7c7460", "#5d6878"],
  faint: ["#9a9080", "#46505e"],

  // Accents
  green: ["#2d5a27", "#74b85e"],
  greenDeep: ["#1f4a1a", "#5aaa3a"],
  greenBg: ["#e9f0dc", "#13200f"],
  greenBorder: ["#a8c388", "#2a4830"],
  navy: ["#1a2e4a", "#7ab4e8"],
  red: ["#a8321f", "#e06848"],
  amber: ["#9a6510", "#d9a23f"],
  amberBg: ["#fbf2e0", "#211a10"],
  amberBorder: ["#dfb778", "#54401e"],

  // Rules
  border: ["#c9bfa6", "#222837"],
  borderSoft: ["#ddd5c0", "#1c2230"],
} as const;

export type PairKey = keyof typeof P;
