import { useEffect } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { DISPLAY, P, TOKENS } from "../theme";
import { GoblinIcon } from "./GoblinMascot";
import { TocList } from "./TableOfContents";
import { useBook } from "../useContent";
import { tr } from "../i18n";
import { DrawerSectionLabel, MobileBookmarks, MobileDrawerToggles, MobileNavLinks } from "./MobileDrawerSections";

/**
 * Phone/tablet hamburger drawer: nav links, region-grouped TOC (shared with
 * the desktop sidebar, touch-restyled), and saved bookmarks. Closes on scrim
 * tap, Escape, or any selection.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const location = useLocation();
  const { data: book } = useBook();

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const chMatch = location.pathname.match(/^\/chapter\/(\d+)/);
  const activeChapter = chMatch ? parseInt(chMatch[1], 10) : -1;

  const bg = c(...P.panelBgAlt);
  const border = c(...P.borderSoft);
  const ink = c(...P.ink);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const muted = c(...P.muted);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: c("rgba(35,33,26,0.4)", "rgba(0,0,0,0.6)"),
          zIndex: 199,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: "min(320px, 86vw)",
          background: bg,
          borderRight: `1px solid ${border}`,
          zIndex: 200,
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          boxShadow: open ? c("4px 0 24px rgba(40,30,10,0.25)", "4px 0 24px rgba(0,0,0,0.6)") : "none",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 16px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <GoblinIcon size={TOKENS.icon.mobileDrawerLogo} />
            <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 800, fontSize: "18px", color: ink }}>
              DATA GOBLIN
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", background: "none", border: "none", cursor: "pointer", color: muted }}
          >
            <X size={22} />
          </button>
        </div>

        <MobileDrawerToggles />

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "24px" }}>
          <MobileNavLinks onNavigate={onClose} />

          <DrawerSectionLabel label={tr("Table of Contents")} color={navy} />
          <TocList book={book} activeChapter={activeChapter} touch onNavigate={onClose} />

          <DrawerSectionLabel label={tr("Bookmarks")} color={green} />
          <MobileBookmarks onNavigate={onClose} />
        </div>
      </div>
    </>
  );
}
