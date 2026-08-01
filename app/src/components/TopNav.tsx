import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink, useNavigate } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { tr } from "../i18n";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, TOKENS, UI } from "../theme";
import { isNavActive, OVERFLOW_NAV, PRIMARY_NAV } from "../navigation";
import { preloadReaderRoute } from "../lazyRoutes";
import { useFocusTrap } from "../focusTrap";
import { GoblinIcon, NavIcon } from "./GoblinMascot";

/**
 * The "More" menu holding the nav items that don't earn a labelled slot.
 *
 * Nine labelled items never fit the header at laptop widths (see navigation.ts),
 * so the primary five are labelled inline and the rest live here — every
 * destination still reachable, none of them reduced to an unlabelled icon.
 * The trigger reads as active whenever the current route is inside the menu,
 * so a reader on /about doesn't see an entirely unlit nav.
 */
function MoreMenu({ pathname }: { pathname: string }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  const green = c(...P.green);
  const muted = c(...P.muted);
  const border = c(...P.border);
  const containsActive = OVERFLOW_NAV.some((i) => isNavActive(pathname, i));

  // Any route change closes the menu — selecting an item navigates, and the
  // menu must not survive a back/forward either.
  useEffect(() => setOpen(false), [pathname]);

  // Pointer outside the trigger+panel closes it. Escape and focus containment
  // come from useFocusTrap.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tr("More")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: UI,
          fontSize: "12px",
          fontWeight: open || containsActive ? 700 : 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: open || containsActive ? green : muted,
          padding: "9px 7px",
          borderBottom: containsActive ? `2px solid ${green}` : "2px solid transparent",
          transition: "color 0.15s",
        }}
      >
        {tr("More")}
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div
          ref={menuRef}
          tabIndex={-1}
          role="menu"
          aria-label={tr("More")}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "210px",
            background: c(...P.panelBg),
            border: `1px solid ${border}`,
            borderRadius: "3px",
            boxShadow: c("0 8px 24px rgba(40,30,10,0.18)", "0 8px 24px rgba(0,0,0,0.6)"),
            padding: "5px",
            zIndex: 60,
          }}
        >
          {OVERFLOW_NAV.map((l) => {
            const active = isNavActive(pathname, l);
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "9px 10px",
                  borderRadius: "2px",
                  textDecoration: "none",
                  fontFamily: UI,
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: active ? green : muted,
                }}
              >
                <NavIcon name={l.icon} size={26} />
                {tr(l.label)}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        Breakpoints below are measured in the browser, not calculated, and they
        interlock — retune them together if the nav contents change.

        With five labelled items plus the More menu the labelled nav needs a
        588px track (34px icons) or ~658px (48px icons), against ~657px of
        fixed chrome — so labels fit from ~1244px, and the logo subtitle (a
        further ~172px) can come back at ~1490px. The old nine-item nav needed
        ~1114px and never fit below 1830px, which is why every laptop-width
        visitor used to see unlabelled icons.

        The icon-size step sits at 1360px rather than at the label breakpoint so
        the 48px icons never switch on while the track is still too narrow for
        them — a gap there would clip the trailing item.
      */}
      <style>{`
        @media (max-width: 1500px){ .dg-logo-sub{ display:none; } }
        @media (max-width: 1250px){ .dg-navlabel{ display:none; } }
        @media (max-width: 1360px){
          .dg-navlink img, .dg-navlink svg{ width:34px !important; height:34px !important; }
          .dg-navlink{ padding:9px 5px !important; }
        }
      `}</style>

      <nav style={{ display: "flex", alignItems: "center", gap: "3px", flex: 1, minWidth: 0, overflow: "hidden" }}>
        {PRIMARY_NAV.map((l) => (
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
            <span className="dg-navlabel">{tr(l.short ?? l.label)}</span>
          </NavLink>
        ))}
        <MoreMenu pathname={location.pathname} />
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
