import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { setUiLang, onI18nReady, isI18nReady } from "./i18n";
import { sectionLinkValue } from "./sectionLinks";

export type Lang = "en" | "fr";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  setReaderDestination: (key: string, href: string | null) => void;
}

const Ctx = createContext<LanguageCtx>({ lang: "en", setLang: () => {}, toggle: () => {}, setReaderDestination: () => {} });

/** Strip a leading /fr, returning the language-neutral path ("/", "/map", …). */
function basePath(pathname: string): string {
  if (pathname === "/fr") return "/";
  if (pathname.startsWith("/fr/")) return pathname.slice(3);
  return pathname;
}

/** The URL for a given language from any current path. */
export function langPath(pathname: string, lang: Lang): string {
  const base = basePath(pathname);
  if (lang === "fr") return base === "/" ? "/fr" : "/fr" + base;
  return base;
}

/**
 * App language is derived from the URL: /fr and /fr/* are the French edition,
 * everything else is English. Each language therefore has its own crawlable URL
 * (with hreflang alternates from prerender-meta.cjs). Switching navigates
 * between the two; the choice is also remembered in localStorage.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname, search, hash, key } = useLocation();
  const navigate = useNavigate();
  const readerDestination = useRef<{ key: string; href: string } | null>(null);
  const setReaderDestination = useCallback((entryKey: string, href: string | null) => {
    if (href) readerDestination.current = { key: entryKey, href };
    else if (readerDestination.current?.key === entryKey) readerDestination.current = null;
  }, []);
  const lang: Lang = pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";

  // A cached dictionary can finish before React attaches the subscription.
  useSyncExternalStore(onI18nReady, isI18nReady);
  // Keep tr() in sync synchronously, before children render.
  setUiLang(lang);
  useEffect(() => {
    try { localStorage.setItem("goblin-lang", lang); } catch { /* private mode */ }
    try { document.documentElement.lang = lang === "fr" ? "fr-CA" : "en-CA"; } catch { /* no dom */ }
  }, [lang]);

  const setLang = (l: Lang) => {
    if (l === lang) return;
    const saved = readerDestination.current;
    if (saved?.key === key) {
      navigate(langPath(saved.href, l));
      return;
    }
    const section = sectionLinkValue(search, hash);
    const pendingSection = section && /^\/(?:guide|chapter\/\d+)\/?$/.test(basePath(pathname))
      ? (section === hash.slice(1) ? hash : `?${new URLSearchParams({ section })}`) : "";
    const receipt = /^\/receipts\/?$/.test(basePath(pathname)) && /^#receipt-\d+(?:-\d+)?$/.test(hash) ? hash : "";
    navigate(langPath(pathname, l) + (pendingSection || receipt));
  };
  const toggle = () => setLang(lang === "en" ? "fr" : "en");
  return <Ctx.Provider value={{ lang, setLang, toggle, setReaderDestination }}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
