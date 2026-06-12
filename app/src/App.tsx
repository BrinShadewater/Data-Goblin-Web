import { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { ReaderProvider, useReader } from "./reader";
import { P } from "./theme";
import { TopNav } from "./components/TopNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { CookieNotice } from "./components/CookieNotice";
import goblinFavicon from "./assets/goblin-head-icon.webp";

// Route-level code splitting: page chunks load on demand, with search mounted
// only after the user types a real query.
const FieldGuidePage = lazy(() => import("./pages/FieldGuidePage").then((m) => ({ default: m.FieldGuidePage })));
const ReceiptsPage = lazy(() => import("./pages/ReceiptsPage").then((m) => ({ default: m.ReceiptsPage })));
const LootPage = lazy(() => import("./pages/LootPage").then((m) => ({ default: m.LootPage })));
const MapPage = lazy(() => import("./pages/MapPage").then((m) => ({ default: m.MapPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContributePage = lazy(() => import("./pages/ContributePage").then((m) => ({ default: m.ContributePage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const SearchOverlay = lazy(() => import("./components/SearchOverlay").then((m) => ({ default: m.SearchOverlay })));

function Shell() {
  const { c } = useTheme();
  const { mode } = useReader();
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
      <Suspense
        fallback={
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: c("#7c7460", "#5d6878"), fontStyle: "italic", fontSize: "14px" }}>
            Opening…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/guide" element={<FieldGuidePage />} />
          <Route path="/chapter/:num" element={<FieldGuidePage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/loot" element={<LootPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contribute" element={<ContributePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<FieldGuidePage />} />
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
    <ThemeProvider>
      <ReaderProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </ReaderProvider>
    </ThemeProvider>
  );
}
