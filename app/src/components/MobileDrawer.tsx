import { useEffect } from "react";
import { Bookmark as BookmarkIcon, Moon, Sun, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { GoblinIcon, NavIcon } from "./GoblinMascot";
import { TocList } from "./LeftSidebar";
import { isNavActive, NAV_ITEMS } from "../navigation";
import { removeBookmark, saveLastLocation, useBookmarks } from "../bookmarks";
import { savePanel } from "../pagination";
import { useBook } from "../useContent";

/**
 * Phone/tablet hamburger drawer: nav links, region-grouped TOC (shared with
 * the desktop sidebar, touch-restyled), and saved bookmarks. Closes on scrim
 * tap, Escape, or any selection.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c, dark, toggle } = useTheme();
  const { dyslexic, toggleDyslexic } = useReader();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: book } = useBook();
  const bookmarks = useBookmarks();

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
  const body = c(...P.body);

  const sectionLabel = (label: string, color: string) => (
    <div
      style={{
        fontFamily: MONO,
        fontSize: "8.5px",
        fontWeight: 800,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color,
        padding: "14px 16px 6px",
        borderTop: `1px solid ${border}`,
        marginTop: "8px",
      }}
    >
      {label}
    </div>
  );

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
            <GoblinIcon size={34} />
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

        {/* Toggles: theme + dyslexia-friendly type */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 16px", flexShrink: 0 }}>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              minHeight: "44px",
              background: "none",
              border: `1px solid ${border}`,
              borderRadius: RADIUS,
              cursor: "pointer",
              color: body,
              fontFamily: UI,
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={toggleDyslexic}
            aria-pressed={dyslexic}
            title="Dyslexia-friendly type"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              minHeight: "44px",
              background: dyslexic ? green : "none",
              border: `1px solid ${dyslexic ? green : border}`,
              borderRadius: RADIUS,
              cursor: "pointer",
              color: dyslexic ? c("#f4f0e0", "#0d1018") : body,
              fontFamily: UI,
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 800 }}>Aa</span>
            Easy-read type
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "24px" }}>
          {/* Nav links */}
          {NAV_ITEMS.map((l) => {
            const active = isNavActive(location.pathname, l);
            return (
              <button
                key={l.to}
                onClick={() => {
                  navigate(l.to);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  minHeight: "44px",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  borderLeft: active ? `3px solid ${green}` : "3px solid transparent",
                  cursor: "pointer",
                  fontFamily: UI,
                  fontSize: "13px",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: active ? green : body,
                  textAlign: "left",
                }}
              >
                <NavIcon name={l.icon} size={27} />
                {l.label}
              </button>
            );
          })}

          {/* TOC */}
          {sectionLabel("Table of Contents", navy)}
          <TocList book={book} activeChapter={activeChapter} touch onNavigate={onClose} />

          {/* Bookmarks */}
          {sectionLabel("Bookmarks", green)}
          {bookmarks.length === 0 ? (
            <p style={{ fontFamily: UI, fontSize: "11.5px", color: muted, margin: 0, padding: "6px 16px", lineHeight: 1.5 }}>
              No bookmarks yet. Tap the 🔖 in the page bar to save your place.
            </p>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={`${bm.doc}-${bm.panelIndex}-${bm.ts}`}
                style={{ display: "flex", alignItems: "flex-start", gap: "4px", padding: "0 8px 0 16px" }}
              >
                <button
                  onClick={() => {
                    savePanel(bm.doc, bm.panelIndex);
                    saveLastLocation(bm.doc, bm.panelIndex);
                    navigate(`/chapter/${bm.doc}`);
                    onClose();
                  }}
                  style={{ flex: 1, minWidth: 0, minHeight: "44px", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <BookmarkIcon size={11} color={green} fill={green} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: navy }}>{bm.chapterTitle}</span>
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: "11.5px", color: body, lineHeight: 1.4 }}>{bm.snippet}</div>
                </button>
                <button
                  onClick={() => removeBookmark(bm.doc, bm.panelIndex)}
                  aria-label="Remove bookmark"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", background: "none", border: "none", cursor: "pointer", color: muted, flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
