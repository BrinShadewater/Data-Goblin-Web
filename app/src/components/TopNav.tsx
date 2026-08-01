import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router";
import { NavLink, useNavigate } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { tr } from "../i18n";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, TOKENS, UI } from "../theme";
import { isNavActive, NAV_ITEMS, type NavItem } from "../navigation";
import { preloadReaderRoute } from "../lazyRoutes";
import { useFocusTrap } from "../focusTrap";
import { GoblinIcon, NavIcon } from "./GoblinMascot";

/** Width of the More panel. Fixed, because the portal anchors it by pixel. */
const MENU_WIDTH = 210;

/**
 * Overflow menu for whatever the nav could not fit. It is a fallback, not a
 * fixed part of the design: when every item fits, this is not rendered at all
 * (see `DesktopNavItems`). The trigger reads as active whenever the current
 * route is one of the hidden ones, so a reader on an overflowed page doesn't
 * see an entirely unlit nav.
 */
function MoreMenu({ pathname, items }: { pathname: string; items: NavItem[] }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  // Gated on `anchor`, not `open`: the panel only mounts once its position has
  // been measured, so trapping on `open` alone ran while the ref was still
  // null and focus never entered the menu.
  const menuRef = useFocusTrap<HTMLDivElement>(open && anchor !== null, () => setOpen(false));

  const green = c(...P.green);
  const muted = c(...P.muted);
  const border = c(...P.border);
  const containsActive = items.some((i) => isNavActive(pathname, i));

  // Any route change closes the menu — selecting an item navigates, and the
  // menu must not survive a back/forward either.
  useEffect(() => setOpen(false), [pathname]);

  // Pointer outside the trigger AND outside the panel closes it. The panel is
  // portalled out of this subtree, so both have to be checked. Escape and focus
  // containment come from useFocusTrap.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, menuRef]);

  // The panel renders in a portal on <body>, because `nav` is overflow:hidden
  // (it has to be — it is the flex track that clips nav items rather than
  // letting them spill into the search box). An absolutely-positioned dropdown
  // inside it was cropped to the 54px nav row, so only the top of the first
  // item survived. A portal cannot be clipped by an ancestor, but it also
  // cannot inherit position from one, so the panel is anchored to the
  // trigger's viewport rect and re-measured whenever that could move.
  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Keep the panel on screen if the trigger sits near the right edge.
      const left = Math.min(r.left, window.innerWidth - MENU_WIDTH - 8);
      setAnchor({ top: r.bottom + 6, left: Math.max(8, left) });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
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

      {open && anchor && createPortal(
        <div
          ref={menuRef}
          tabIndex={-1}
          role="menu"
          aria-label={tr("More")}
          style={{
            position: "fixed",
            top: `${anchor.top}px`,
            left: `${anchor.left}px`,
            width: `${MENU_WIDTH}px`,
            background: c(...P.panelBg),
            border: `1px solid ${border}`,
            borderRadius: "3px",
            boxShadow: c("0 8px 24px rgba(40,30,10,0.18)", "0 8px 24px rgba(0,0,0,0.6)"),
            padding: "5px",
            // Above the header (zIndex 50) and the reader chrome.
            zIndex: 210,
          }}
        >
          {items.map((l) => {
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
        </div>,
        document.body
      )}
    </div>
  );
}

/** Room to reserve for the More trigger when not everything fits. */
const MORE_TRIGGER_W = 80;
const NAV_GAP = 3;
/** Gap between a nav item's icon and its label — see the NavLink style below. */
const ICON_LABEL_GAP = 5;

/**
 * The desktop nav track. Measured, not breakpointed, and it degrades in this
 * order:
 *
 *   1. every item, labelled
 *   2. every item, icons only   <- labels are what gets sacrificed first
 *   3. as many icons as fit, the rest in a More menu
 *
 * Seeing all nine destinations matters more than reading their names, so the
 * labels go before any item does. A breakpoint cannot express this: whether
 * the labels fit depends on how wide they are in the current language, the
 * icon-size step, and how much room the logo and search box have taken. An
 * earlier fixed "five labelled + More" split got it wrong in both directions —
 * it hid four destinations at 1900px where all nine fit, and at 1280px it
 * showed five labelled items when all nine icons would have fitted.
 *
 * One measuring pass does it: render everything labelled, read each item's
 * width and each label's width, and derive the icon-only widths by subtraction.
 * It runs in useLayoutEffect, so it settles before paint.
 */
function DesktopNavItems({
  pathname,
  green,
  muted,
}: {
  pathname: string;
  green: string;
  muted: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  // null = "measure on the next layout"; otherwise the settled decision.
  const [fit, setFit] = useState<{ labels: boolean; count: number } | null>(null);
  // Track width at the last measurement. ResizeObserver fires once on observe()
  // even when nothing moved, and re-measuring on that would reset state, which
  // re-observes, which fires again — an endless loop that keeps tearing the nav
  // down and rebuilding it. Only a genuine width change may trigger a re-measure.
  const measuredWidth = useRef(-1);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const decide = () => {
      const avail = nav.clientWidth;
      measuredWidth.current = avail;
      const links = Array.from(nav.children).filter((el) => el.tagName === "A") as HTMLElement[];
      if (links.length === 0) return;

      const gaps = (n: number) => NAV_GAP * Math.max(0, n - 1);
      const labelled = links.map((el) => el.offsetWidth);
      // Icon-only width = the item minus its label and the gap before it.
      const iconOnly = links.map((el, i) => {
        const label = el.querySelector<HTMLElement>(".dg-navlabel");
        const labelW = label ? label.offsetWidth : 0;
        return labelled[i] - (labelW > 0 ? labelW + ICON_LABEL_GAP : 0);
      });

      const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

      if (sum(labelled) + gaps(labelled.length) <= avail) {
        setFit({ labels: true, count: NAV_ITEMS.length });
        return;
      }
      if (sum(iconOnly) + gaps(iconOnly.length) <= avail) {
        setFit({ labels: false, count: NAV_ITEMS.length });
        return;
      }
      // Not even every icon fits, so the More trigger needs room too.
      const budget = avail - MORE_TRIGGER_W - NAV_GAP;
      let used = 0;
      let n = 0;
      for (const w of iconOnly) {
        const next = used + w + (n > 0 ? NAV_GAP : 0);
        if (next > budget) break;
        used = next;
        n++;
      }
      setFit({ labels: false, count: Math.max(1, Math.min(n, NAV_ITEMS.length)) });
    };

    if (fit === null) {
      decide();
      return;
    }

    // Re-measure from scratch when the track actually changes width — widths
    // depend on the icon-size step and on label visibility, so nothing can be
    // cached. The width guard is what stops the observe-callback loop.
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = navRef.current;
        if (el && el.clientWidth !== measuredWidth.current) setFit(null);
      });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(nav);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [fit, pathname]);

  // While measuring, everything renders labelled so both widths are readable.
  const measuring = fit === null;
  const showLabels = measuring || fit.labels;
  const shown = measuring ? NAV_ITEMS : NAV_ITEMS.slice(0, fit.count);
  const overflow = measuring ? [] : NAV_ITEMS.slice(fit.count);

  return (
    <nav
      ref={navRef}
      style={{ display: "flex", alignItems: "center", gap: `${NAV_GAP}px`, flex: 1, minWidth: 0, overflow: "hidden" }}
    >
      {shown.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className="dg-navlink"
          title={tr(l.label)}
          onMouseEnter={l.to === "/guide" ? preloadReaderRoute : undefined}
          onFocus={l.to === "/guide" ? preloadReaderRoute : undefined}
          style={({ isActive }) => {
            const active = isActive || isNavActive(pathname, l);
            return {
              fontFamily: UI,
              // 12px/0.04em rather than 13.5px/0.06em: the tighter metrics buy
              // the labels ~330px, and this is UI chrome, never reading type.
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
              flexShrink: 0,
            };
          }}
        >
          <NavIcon name={l.icon} size={TOKENS.icon.headerNav} />
          <span className="dg-navlabel" style={{ display: showLabels ? "inline" : "none" }}>
            {tr(l.short ?? l.label)}
          </span>
        </NavLink>
      ))}
      {overflow.length > 0 && <MoreMenu pathname={pathname} items={overflow} />}
    </nav>
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
        Label visibility is NOT a breakpoint — DesktopNavItems measures whether
        the labels fit and hides them if they don't. What stays in CSS is the
        logo subtitle (it competes with the nav for the same row) and the icon
        size step, which is about 48px icons being oversized in a tight track
        rather than about fit.
      */}
      <style>{`
        /* The tagline costs the nav ~172px of the same row. Yielding it below
           2100px is what lets the nav labels appear from ~1810px instead of
           ~2130px — naming the destinations beats decorating the logo at the
           widths people actually browse at. */
        @media (max-width: 2100px){ .dg-logo-sub{ display:none; } }
        @media (max-width: 1360px){
          .dg-navlink img, .dg-navlink svg{ width:34px !important; height:34px !important; }
          .dg-navlink{ padding:9px 5px !important; }
        }
      `}</style>

      <DesktopNavItems pathname={location.pathname} green={green} muted={muted} />

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
