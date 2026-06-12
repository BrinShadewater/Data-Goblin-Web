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

/** Live viewport mode: phone <700px, tablet 700–1024px, desktop >1024px. */
export function useViewport(): ReaderMode {
  const [mode, setMode] = useState<ReaderMode>(() =>
    typeof window === "undefined" ? "desktop" : modeFor(window.innerWidth)
  );
  useEffect(() => {
    const onResize = () => setMode(modeFor(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mode;
}

interface ReaderCtx {
  mode: ReaderMode;
  /** Dyslexia-friendly type: Atkinson Hyperlegible, looser spacing, no italics. */
  dyslexic: boolean;
  toggleDyslexic: () => void;
  /** Type scale for the active mode + reading mode. */
  t: TypeScale;
}

const READING_KEY = "goblin-reading-mode";

const Ctx = createContext<ReaderCtx>({
  mode: "desktop",
  dyslexic: false,
  toggleDyslexic: () => {},
  t: typeScale("desktop", false),
});

export function ReaderProvider({ children }: { children: ReactNode }) {
  const mode = useViewport();
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
  const value = useMemo<ReaderCtx>(
    () => ({
      mode,
      dyslexic,
      toggleDyslexic: () => setDyslexic((v) => !v),
      t: typeScale(mode, dyslexic),
    }),
    [mode, dyslexic]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useReader = () => useContext(Ctx);
