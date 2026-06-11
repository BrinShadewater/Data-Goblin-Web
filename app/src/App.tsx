import { useEffect, useState } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { P } from "./theme";
import { TopNav } from "./components/TopNav";
import { SearchOverlay } from "./components/SearchOverlay";
import { FieldGuidePage } from "./pages/FieldGuidePage";
import { ReceiptsPage } from "./pages/ReceiptsPage";
import { LootPage } from "./pages/LootPage";
import { MapPage } from "./pages/MapPage";
import { AboutPage } from "./pages/AboutPage";
import { ContributePage } from "./pages/ContributePage";
import goblinFavicon from "./assets/goblin-head-icon.png";

function Shell() {
  const { c } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
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

  // Close the search overlay when navigating.
  useEffect(() => {
    setSearchQuery("");
  }, [location.pathname]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: c(...P.appBg),
        transition: "background 0.3s",
      }}
    >
      <TopNav searchQuery={searchQuery} onSearch={setSearchQuery} />
      <Routes>
        <Route path="/" element={<FieldGuidePage />} />
        <Route path="/chapter/:num" element={<FieldGuidePage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/loot" element={<LootPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="*" element={<FieldGuidePage />} />
      </Routes>
      <SearchOverlay query={searchQuery} onClose={() => setSearchQuery("")} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </ThemeProvider>
  );
}
