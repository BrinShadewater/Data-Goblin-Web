import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { DISPLAY, P, TOKENS } from "../theme";
import { GoblinIcon } from "./GoblinMascot";
import { useFocusTrap } from "../focusTrap";
import { TocList } from "./TableOfContents";
import { useBook } from "../useContent";
import { tr } from "../i18n";
import { DrawerSectionLabel, MobileBookmarks, MobileDrawerToggles, MobileNavLinks } from "./MobileDrawerSections";

/**
 * Phone/tablet hamburger drawer: nav links, region-grouped TOC (shared with
 * the desktop sidebar, touch-restyled), and saved bookmarks. Closes on scrim
 * tap, Escape, or any selection.
 *
 * The panel stays mounted so it can slide, but a closed drawer must not haunt
 * the page: parked at translateX(-105%) it still carried ~40 tabbable controls
 * and a role="dialog" aria-modal into the tree, so keyboard users tabbed
 * through an invisible menu. `visibility: hidden` takes the whole subtree out
 * of the tab order and the accessibility tree; unmounting would kill the slide.
 * Focus is trapped while open, which also supplies the Escape handler.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const location = useLocation();
  const { data: book } = useBook();
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  // Visibility lags the close by the length of the slide so the panel can
  // animate out before it leaves the accessibility tree. This is a timer
  // rather than a `transition: visibility 0s 0.25s`, because a CSS transition
  // only advances while the page produces frames — in a background tab it
  // never completes, and the drawer would stay focusable indefinitely. That is
  // precisely the bug being fixed, so it must not depend on frames.
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(t);
  }, [open]);

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
        ref={trapRef}
        tabIndex={-1}
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
          visibility: visible ? "visible" : "hidden",
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
