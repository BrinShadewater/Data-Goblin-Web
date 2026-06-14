import { createElement, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import { ListenProvider } from "./ListenContext";
import { ListenBar } from "./components/ListenBar";
import { ReaderProvider, useReader } from "./reader";
import { P } from "./theme";
import { TopNav } from "./components/TopNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { CookieNotice } from "./components/CookieNotice";
import goblinFavicon from "./assets/goblin-head-icon.webp";
import { APP_ROUTES, SearchOverlay } from "./lazyRoutes";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Data Goblin — A Field Guide to AI, Power, and Data in Canada",
  "/guide": "Field Guide — Data Goblin",
  "/map": "Map — Data Goblin",
  "/loot": "Glossary — Data Goblin",
  "/receipts": "Receipts — Data Goblin",
  "/about": "About — Data Goblin",
  "/contribute": "Contribute — Data Goblin",
  "/updates": "Updates & Corrections — Data Goblin",
  "/toolkit": "The Toolkit · Test Any AI Claim — Data Goblin",
  "/privacy": "Privacy — Data Goblin",
};
function docTitleFor(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  const ch = pathname.match(/^\/chapter\/(\d+)/);
  if (ch) {
    const n = Number(ch[1]);
    return (n === 0 ? "Front Matter" : n === 20 ? "Source Library Appendix" : `Chapter ${n}`) + " — Data Goblin";
  }
  return "Data Goblin — A Field Guide to AI, Power, and Data in Canada";
}

function Shell() {
  const { c } = useTheme();
  const { mode } = useReader();
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Goblin-head favicon.
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = goblinFavicon;
  }, []);

  // Close the search overlay and the drawer when navigating.
  useEffect(() => {
    setSearchQuery("");
    setDrawerOpen(false);
  }, [location.pathname]);

  // The drawer only exists on phone/tablet — drop it when resizing up.
  useEffect(() => {
    if (mode === "desktop") setDrawerOpen(false);
  }, [mode]);

  // Keep the browser tab title in sync on client-side navigation (full-page
  // loads and shared links already get the right title from prerender-meta).
  useEffect(() => {
    document.title = docTitleFor(location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: c(...P.appBg),
        transition: "background 0.3s",
      }}
    >
      {/* Reference-link styling: authored links underline on hover; pipeline
          autolinks carry a quiet dotted underline. Colors stay inline. */}
      <style>{`
        a.gob-link { text-decoration: none; }
        a.gob-link:hover { text-decoration: underline; }
        a.gob-autolink { text-decoration: underline dotted; text-underline-offset: 3px; }
        a.gob-autolink:hover { text-decoration: underline solid; }
      `}</style>
      <TopNav searchQuery={searchQuery} onSearch={setSearchQuery} onMenu={() => setDrawerOpen(true)} />
      {lang === "fr" && (
        <div
          role="status"
          style={{
            flexShrink: 0,
            textAlign: "center",
            padding: "6px 14px",
            background: c("#e4edf8", "#0f1c2c"),
            borderBottom: `1px solid ${c("#c2d4ea", "#27405c")}`,
            color: c("#1f5488", "#9cc8f0"),
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "11px",
            letterSpacing: "0.04em",
            lineHeight: 1.4,
          }}
        >
          Traduction automatique — en cours de révision.
        </div>
      )}
      <ListenBar />
      <Suspense
        fallback={
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: c("#7c7460", "#5d6878"), fontStyle: "italic", fontSize: "14px" }}>
            Opening…
          </div>
        }
      >
        <Routes>
          {APP_ROUTES.map(({ path, Page }) => (
            <Route key={path} path={path} element={createElement(Page)} />
          ))}
        </Routes>
      </Suspense>
      <CookieNotice />
      {/* Mounted only while a query is active: the search chunk (and its
          whole-book index fetch) loads on first real search, not on app load. */}
      {searchQuery.trim().length >= 2 && (
        <Suspense fallback={null}>
          <SearchOverlay query={searchQuery} onClose={() => setSearchQuery("")} />
        </Suspense>
      )}
      {mode !== "desktop" && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ReaderProvider>
          <ListenProvider>
            <BrowserRouter>
              <Shell />
            </BrowserRouter>
          </ListenProvider>
        </ReaderProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
