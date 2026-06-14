import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLanguage } from "./LanguageContext";

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
  /** Pick the light or dark value of a colour pair. */
  c: (light: string, dark: string) => string;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {}, c: (l) => l });

// French edition = "blue mode". The French build is a machine translation, and
// the whole palette shifts cool/blue while it is active so the edition reads as
// visibly distinct. This is a value-keyed remap applied at colour-resolution
// time, so every component that goes through c() repaints with no extra edits.
// Warm parchment -> cool slate; goblin green accent -> blue. Semantic amber/red
// (warnings, corrections) are deliberately left alone.
const FR_BLUE: Record<string, string> = {
  // --- warm surfaces (light) -> cool slate ---
  "#d8d2c4": "#c6ccd6", "#ece5d3": "#dde2ec", "#f2ece0": "#e5e9f1",
  "#faf8f0": "#f3f6fb", "#f5f0e4": "#edf1f8", "#fffdf6": "#fafcff",
  "#f0ece2": "#e7ebf3",
  // --- warm ink / rules (light) -> cool ---
  "#23211a": "#1b2130", "#16140e": "#121826", "#2e2b20": "#232839",
  "#655e4a": "#505a6c", "#685f4c": "#535d6f",
  "#c9bfa6": "#b7c1d0", "#ddd5c0": "#ccd3e0",
  // --- warm ink (dark) -> cool ---
  "#c8c2b0": "#c2c8d4", "#ece6d4": "#e3e8f2", "#bfb9a8": "#b6bcca",
  // --- green accent -> blue (light + dark) ---
  "#2d5a27": "#1f5488", "#74b85e": "#5fb0e6",
  "#1f4a1a": "#164878", "#5aaa3a": "#4f9ad6",
  "#e9f0dc": "#dde8f5", "#13200f": "#0e1a28",
  "#a8c388": "#8aabcb", "#2a4830": "#26405c",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("goblin-theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("goblin-theme", dark ? "dark" : "light");
    } catch {
      /* private mode — ignore */
    }
  }, [dark]);
  const toggle = () => setDark((v) => !v);
  const c = (light: string, d: string) => {
    const picked = dark ? d : light;
    return lang === "fr" ? FR_BLUE[picked.toLowerCase()] ?? picked : picked;
  };
  return <Ctx.Provider value={{ dark, toggle, c }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
