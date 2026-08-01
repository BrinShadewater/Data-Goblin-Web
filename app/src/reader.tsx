// ---------------------------------------------------------------------------
// Reader context: viewport mode (phone / tablet / desktop) + the
// dyslexia-friendly reading mode, plus the derived type scale. Wraps the app
// so every component renders the right metrics for the active mode.
// ---------------------------------------------------------------------------

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { ReaderMode } from "./pagination";
import { TypeScale, typeScale } from "./theme";

function modeFor(width: number): ReaderMode {
  return width < 700 ? "phone" : width <= 1024 ? "tablet" : "desktop";
}

// Window height the page budget (pagination.ts PANEL_BUDGET) was tuned for.
// Shorter windows scale the budget down so pages pack fewer blocks and tall
// atomic callouts (Chapter Recap) stop overflowing the fixed-height panel.
const REFERENCE_VH = 820;
function heightScaleFor(vh: number): number {
  if (!vh) return 1;
  const raw = Math.max(0.62, Math.min(1.18, vh / REFERENCE_VH));
  // Quantize to coarse steps so mobile URL-bar show/hide jitter doesn't
  // re-trigger pagination on every resize tick.
  return Math.round(raw / 0.04) * 0.04;
}

// Window width the page budget was tuned for. Each page carries 66px of its
// own horizontal padding (36 + 30), so these constants track FieldGuidePage's
// grid and PagePanel's padding — change them together.
const REFERENCE_VW = 1920;
export const SPREAD_MAX_PX = 1120;
const PANEL_PADDING = 66;

/**
 * Chrome either side of the reading well: the two sidebars plus the centre
 * well's horizontal padding (28 × 2).
 *
 * The sidebars are 260 + 280 normally, and narrow to 196 + 208 below
 * SIDEBAR_NARROW_VW. At 1025px the full-width sidebars took 540px of a 1025px
 * viewport and squeezed the text column to 363px — a 48-character line, when
 * DESIGN.md asks for ~65. Chrome should yield to the prose, not the other way
 * round. Keep these in step with the grid in FieldGuidePage and the media query
 * beside it.
 */
export const SIDEBAR_NARROW_VW = 1200;
const CHROME_WIDE = 260 + 280 + 56;
const CHROME_NARROW = 196 + 208 + 56;
const readerChrome = (vw: number) => (vw <= SIDEBAR_NARROW_VW ? CHROME_NARROW : CHROME_WIDE);

/**
 * Below this window width the reader shows ONE wide page instead of the
 * two-page spread.
 *
 * The spread splits the well in half, so it only earns its place once half a
 * well is still a comfortable line. Raised from 1500 on 2026-08-01: at 1500 the
 * spread's columns were ~386px — a 52-character line — and 1600px gave 58,
 * against DESIGN.md's ~65. A single page at those widths reads better and turns
 * fewer times. The spread now waits until each of its two columns can hold the
 * same measure a single page would.
 */
export const SPREAD_MIN_VW = 1720;

/** Is the two-page spread in play at this window width? */
export function spreadFor(vw: number): boolean {
  return modeFor(vw) === "desktop" && vw >= SPREAD_MIN_VW;
}

/**
 * Width of one page's text column at a given window width, in CSS px.
 *
 * THE MEASURE IS THE INVARIANT. These caps exist to hold the line length near
 * the ~65 characters DESIGN.md asks for, at every width, rather than letting
 * the column grow with the window. Before 2026-08-01 the same chapter rendered
 * at 48 / 83 / 87 / 58 / 85 characters a line across the desktop range — the
 * least stable thing in the layout was the one thing a reading product most
 * needs to hold steady, and 1440px, the commonest laptop width, was the worst
 * of them at 87.
 *
 * Must track FieldGuidePage's maxWidth caps, or the character budget sizes for
 * a column that is not the one rendered.
 */
export const SINGLE_MAX_PX = 560;
function textColumnWidth(vw: number, spread: boolean): number {
  const available = vw - readerChrome(vw);
  const well = Math.min(spread ? SPREAD_MAX_PX : SINGLE_MAX_PX, available);
  return Math.max(120, (spread ? well / 2 : well) - PANEL_PADDING);
}

const REFERENCE_COL = textColumnWidth(REFERENCE_VW, true);

// Below ~1200px the spread's columns get so narrow that scaling the budget all
// the way down would leave pages too short to pack cleanly (and would push
// tall atomic callouts past the sanity gate's 2× ceiling). The floor stops
// there and the panel's overflow scroll — restored by the grid row fix in
// FieldGuidePage — absorbs the remainder rather than clipping it.
const MIN_WIDTH_SCALE = 0.46;

function widthScaleFor(vw: number): number {
  if (!vw || modeFor(vw) !== "desktop") return 1;
  const raw = Math.max(
    MIN_WIDTH_SCALE,
    Math.min(1.1, textColumnWidth(vw, spreadFor(vw)) / REFERENCE_COL)
  );
  // Same coarse quantization as the height scale, so a drag-resize doesn't
  // re-paginate on every tick.
  return Math.round(raw / 0.04) * 0.04;
}

/** Live viewport mode: phone <700px, tablet 700–1024px, desktop >1024px. */
export function useViewport(): {
  mode: ReaderMode;
  heightScale: number;
  widthScale: number;
  spread: boolean;
} {
  const read = () =>
    typeof window === "undefined"
      ? { mode: "desktop" as ReaderMode, heightScale: 1, widthScale: 1, spread: true }
      : {
          mode: modeFor(window.innerWidth),
          heightScale: heightScaleFor(window.innerHeight),
          widthScale: widthScaleFor(window.innerWidth),
          spread: spreadFor(window.innerWidth),
        };
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () =>
      setVp((prev) => {
        const next = read();
        return next.mode === prev.mode &&
          next.heightScale === prev.heightScale &&
          next.widthScale === prev.widthScale &&
          next.spread === prev.spread
          ? prev
          : next;
      });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

interface ReaderCtx {
  mode: ReaderMode;
  /** Budget multiplier from the live viewport height (1 = reference height). */
  heightScale: number;
  /** Budget multiplier from the live text-column width (1 = reference width). */
  widthScale: number;
  /** Two-page spread (wide desktop) vs one wide page (narrow desktop). */
  spread: boolean;
  /** Dyslexia-friendly type: Atkinson Hyperlegible, looser spacing, no italics. */
  dyslexic: boolean;
  toggleDyslexic: () => void;
  /** Type scale for the active mode + reading mode. */
  t: TypeScale;
}

const READING_KEY = "goblin-reading-mode";

const Ctx = createContext<ReaderCtx>({
  mode: "desktop",
  heightScale: 1,
  widthScale: 1,
  spread: true,
  dyslexic: false,
  toggleDyslexic: () => {},
  t: typeScale("desktop", false),
});

export function ReaderProvider({ children }: { children: ReactNode }) {
  const { mode, heightScale, widthScale, spread } = useViewport();
  const [dyslexic, setDyslexic] = useState<boolean>(() => {
    try {
      return localStorage.getItem(READING_KEY) === "dyslexic";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(READING_KEY, dyslexic ? "dyslexic" : "standard");
    } catch {
      /* private mode — ignore */
    }
  }, [dyslexic]);
  // Atkinson is self-hosted like every other face (scripts/fetch-fonts.cjs) but
  // kept out of the main stylesheet and injected on first use: it is ~99 kB
  // that most readers never need, and loading it eagerly would tax everyone for
  // a mode few enable.
  useEffect(() => {
    if (!dyslexic || typeof document === "undefined") return;
    const id = "dg-dyslexia-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "/fonts/atkinson.css";
    document.head.appendChild(link);
  }, [dyslexic]);
  const value = useMemo<ReaderCtx>(
    () => ({
      mode,
      heightScale,
      widthScale,
      spread,
      dyslexic,
      toggleDyslexic: () => setDyslexic((v) => !v),
      t: typeScale(mode, dyslexic),
    }),
    [mode, heightScale, widthScale, spread, dyslexic]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useReader = () => useContext(Ctx);
