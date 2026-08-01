import { Menu, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink, useNavigate } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { tr } from "../i18n";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, TOKENS, UI } from "../theme";
import { isNavActive, NAV_ITEMS } from "../navigation";
import { preloadReaderRoute } from "../lazyRoutes";
import { GoblinIcon, NavIcon } from "./GoblinMascot";

export function TopNav({
  searchQuery,
  onSearch,
  onMenu,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  onMenu: () => void;
}) {
  const { c, dark, toggle } = useTheme();
  const { mode, dyslexic, toggleDyslexic } = useReader();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const bg = c(...P.panelBg);
  const border = c(...P.border);
  const ink = c(...P.ink);
  const green = c(...P.green);
  const muted = c(...P.muted);
  const compact = mode !== "desktop";

  const logo = (
    <button
      onClick={() => navigate("/")}
      style={{ display: "flex", alignItems: "center", gap: "11px", background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 0 }}
    >
      <GoblinIcon size={compact ? TOKENS.icon.headerLogoCompact : TOKENS.icon.headerLogoDesktop} />
      <div style={{ textAlign: "left", minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 800, fontSize: compact ? "21px" : "26px", color: ink, lineHeight: 0.95 }}>
          DATA GOBLIN
        </div>
        <div
          className="dg-logo-sub"
          style={{
            fontFamily: MONO,
            fontSize: compact ? "8.5px" : "10.5px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: muted,
            marginTop: "3px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: compact ? "235px" : undefined,
          }}
        >
          {tr("A field guide to AI, power & data in Canada")}
        </div>
      </div>
    </button>
  );

  // ---- Phone / tablet portrait: logo + hamburger, ≥44px touch target.
  if (compact) {
    return (
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          height: "72px",
          padding: "0 8px 0 14px",
          background: bg,
          borderBottom: `1px solid ${border}`,
          flexShrink: 0,
          zIndex: 50,
          boxShadow: c("0 1px 4px rgba(40,30,10,0.06)", "0 1px 8px rgba(0,0,0,0.35)"),
          transition: "background 0.3s",
        }}
      >
        {logo}
        <button
          onClick={onMenu}
          aria-label="Open menu"
          title="Open menu"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: ink,
            flexShrink: 0,
          }}
        >
          <Menu size={26} />
        </button>
      </header>
    );
  }

  // ---- Desktop: nav links + search + reading-mode + theme toggles.
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: "13px",
        height: "72px",
        padding: "0 18px",
        background: bg,
        borderBottom: `1px solid ${border}`,
        flexShrink: 0,
        zIndex: 50,
        boxShadow: c("0 1px 4px rgba(40,30,10,0.06)", "0 1px 8px rgba(0,0,0,0.35)"),
        transition: "background 0.3s",
      }}
    >
      {logo}

      {/*
        Nine labelled nav items are a tight fit, and the old 1880px breakpoint
        revealed them into an overflow:hidden nav that needed ~2120px — so
        between 1881px and ~2120px the trailing labels were silently clipped
        rather than hidden. Measured in the browser at the tightened metrics
        below: the labelled nav needs a 1114px track against 708px of fixed
        chrome, so labels fit from ~1822px once the logo subtitle steps aside
        (it costs a further ~172px, hence the second breakpoint). Below the
        label breakpoint they hide cleanly and each icon keeps its `title` as
        its accessible name.

        Nine top-level items is the real constraint here — see WORK-LOG.
      */}
      <style>{`
        @media (max-width: 2010px){ .dg-logo-sub{ display:none; } }
        @media (max-width: 1830px){ .dg-navlabel{ display:none; } }
        /* Below ~1300px the 48px nav icons alone overrun the track and the
           overflow:hidden nav drops the trailing items. 34px seats all nine
           from ~1150px up. Narrower than that, nine top-level items genuinely
           do not fit and want an IA decision, not a smaller icon. */
        @media (max-width: 1300px){
          .dg-navlink img, .dg-navlink svg{ width:34px !important; height:34px !important; }
          .dg-navlink{ padding:9px 5px !important; }
        }
      `}</style>

      <nav style={{ display: "flex", alignItems: "center", gap: "3px", flex: 1, minWidth: 0, overflow: "hidden" }}>
        {NAV_ITEMS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className="dg-navlink"
            title={tr(l.label)}
            onMouseEnter={l.to === "/guide" ? preloadReaderRoute : undefined}
            onFocus={l.to === "/guide" ? preloadReaderRoute : undefined}
            style={({ isActive }) => {
              const active = isActive || isNavActive(location.pathname, l);
              return ({
              fontFamily: UI,
              // 12px/0.04em rather than 13.5px/0.06em: the tighter metrics are
              // what let the labels appear ~330px earlier than they otherwise
              // would, and this is UI chrome, never reading type.
              fontSize: "12px",
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              color: active ? green : muted,
              textDecoration: "none",
              padding: "9px 7px",
              borderBottom: active ? `2px solid ${green}` : "2px solid transparent",
              transition: "color 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            });
            }}
          >
            <NavIcon name={l.icon} size={TOKENS.icon.headerNav} />
            <span className="dg-navlabel">{tr(l.label)}</span>
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          background: c(...P.inputBg),
          border: `1px solid ${border}`,
          borderRadius: "3px",
          padding: "5px 11px",
          height: "38px",
          flexShrink: 0,
        }}
      >
        <NavIcon name="search-nav" size={TOKENS.icon.headerSearch} />
        <input
          type="search"
          aria-label={tr("Search the guide")}
          placeholder={tr("Search the guide…")}
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            fontFamily: UI,
            fontSize: "13px",
            color: ink,
            width: "clamp(72px, 7vw, 150px)",
          }}
        />
      </div>

      <div
        role="group"
        aria-label="Language"
        title="Language — French is machine-translated"
        style={{
          display: "flex",
          alignItems: "center",
          height: "38px",
          border: `1px solid ${border}`,
          borderRadius: "3px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {(["en", "fr"] as const).map((value) => {
          const active = lang === value;
          return (
            <button
              key={value}
              onClick={() => setLang(value)}
              aria-pressed={active}
              aria-label={value === "fr" ? "Lire en français (traduction automatique)" : "Read in English"}
              style={{
                height: "100%",
                padding: "0 9px",
                background: active ? green : "none",
                border: "none",
                cursor: "pointer",
                color: active ? c("#f4f0e0", "#0d1018") : muted,
                fontFamily: UI,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              {value.toUpperCase()}
            </button>
          );
        })}
      </div>

      <button
        onClick={toggleDyslexic}
        aria-label="Toggle dyslexia-friendly type"
        aria-pressed={dyslexic}
        title="Dyslexia-friendly type"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: "38px",
          height: "38px",
          background: dyslexic ? green : "none",
          border: `1px solid ${dyslexic ? green : border}`,
          borderRadius: "3px",
          cursor: "pointer",
          color: dyslexic ? c("#f4f0e0", "#0d1018") : muted,
          fontFamily: UI,
          fontSize: "14px",
          fontWeight: 700,
          padding: 0,
        }}
      >
        Aa
      </button>

      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: "38px",
          height: "38px",
          background: "none",
          border: `1px solid ${border}`,
          borderRadius: "3px",
          cursor: "pointer",
          color: muted,
        }}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
