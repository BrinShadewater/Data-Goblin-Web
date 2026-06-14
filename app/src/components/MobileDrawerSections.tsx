import { Bookmark as BookmarkIcon, Moon, Sun, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { useLanguage } from "../LanguageContext";
import { BODY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { isNavActive, NAV_ITEMS } from "../navigation";
import { removeBookmark, saveLastLocation, useBookmarks } from "../bookmarks";
import { savePanel } from "../pagination";
import { NavIcon } from "./GoblinMascot";

export function DrawerSectionLabel({ label, color }: { label: string; color: string }) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  return (
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
}

export function MobileDrawerToggles() {
  const { c, dark, toggle } = useTheme();
  const { dyslexic, toggleDyslexic } = useReader();
  const { lang, setLang } = useLanguage();
  const border = c(...P.borderSoft);
  const green = c(...P.green);
  const body = c(...P.body);

  const langBtn = (value: "en" | "fr", label: string) => {
    const active = lang === value;
    return (
      <button
        onClick={() => setLang(value)}
        aria-pressed={active}
        aria-label={value === "fr" ? "Lire en français (traduction automatique)" : "Read in English"}
        style={{
          flex: 1,
          minHeight: "40px",
          background: active ? green : "none",
          border: `1px solid ${active ? green : border}`,
          borderRadius: RADIUS,
          cursor: "pointer",
          color: active ? c("#f4f0e0", "#0d1018") : body,
          fontFamily: UI,
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
    <div style={{ display: "flex", gap: "8px", padding: "12px 16px 4px", flexShrink: 0 }}>
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
    <div style={{ display: "flex", gap: "8px", padding: "4px 16px 12px", flexShrink: 0 }}>
      {langBtn("en", "English")}
      {langBtn("fr", "Français")}
    </div>
    </>
  );
}

export function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const green = c(...P.green);
  const body = c(...P.body);

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(location.pathname, item);
        return (
          <button
            key={item.to}
            onClick={() => {
              navigate(item.to);
              onNavigate();
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
            <NavIcon name={item.icon} size={TOKENS.icon.mobileDrawerNav} />
            {item.label}
          </button>
        );
      })}
    </>
  );
}

export function MobileBookmarks({ onNavigate }: { onNavigate: () => void }) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const bookmarks = useBookmarks();
  const navy = c(...P.navy);
  const green = c(...P.green);
  const muted = c(...P.muted);
  const body = c(...P.body);

  if (bookmarks.length === 0) {
    return (
      <p style={{ fontFamily: UI, fontSize: "11.5px", color: muted, margin: 0, padding: "6px 16px", lineHeight: 1.5 }}>
        No bookmarks yet. Tap the 🔖 in the page bar to save your place.
      </p>
    );
  }

  return (
    <>
      {bookmarks.map((bm) => (
        <div
          key={`${bm.doc}-${bm.panelIndex}-${bm.ts}`}
          style={{ display: "flex", alignItems: "flex-start", gap: "4px", padding: "0 8px 0 16px" }}
        >
          <button
            onClick={() => {
              savePanel(bm.doc, bm.panelIndex);
              saveLastLocation(bm.doc, bm.panelIndex);
              navigate(`/chapter/${bm.doc}`);
              onNavigate();
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
      ))}
    </>
  );
}
