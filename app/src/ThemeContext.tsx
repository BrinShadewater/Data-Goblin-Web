import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
  /** Pick the light or dark value of a colour pair. */
  c: (light: string, dark: string) => string;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {}, c: (l) => l });

export function ThemeProvider({ children }: { children: ReactNode }) {
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
  const c = (light: string, d: string) => (dark ? d : light);
  return <Ctx.Provider value={{ dark, toggle, c }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
