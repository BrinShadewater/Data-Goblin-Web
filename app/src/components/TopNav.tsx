import { Menu, Moon, Sun } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { DISPLAY, MONO, P, UI } from "../theme";
import { GoblinIcon, NavIcon } from "./GoblinMascot";

export const LINKS: { to: string; label: string; icon: string }[] = [
  { to: "/", label: "Field Guide", icon: "guidebook-nav" },
  { to: "/map", label: "Map", icon: "map-nav" },
  { to: "/loot", label: "Loot (Glossary)", icon: "chest-nav" },
  { to: "/receipts", label: "Receipts", icon: "data-nav" },
  { to: "/about", label: "About", icon: "contact-nav" },
  { to: "/contribute", label: "Contribute", icon: "community-nav" },
];

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
  const navigate = useNavigate();
  const bg = c(...P.panelBg);
  const border = c(...P.border);
  const ink = c(...P.ink);
  const green = c(...P.green);
  const muted = c(...P.muted);
  const compact = mode !== "desktop";

  const logo = (
    <button
      onClick={() => navigate("/")}
      style={{ display: "flex", alignItems: "center", gap: "9px", background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 0 }}
      aria-label="Data Goblin home"
    >
      <GoblinIcon size={26} />
      <div style={{ textAlign: "left", minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 800, fontSize: "16px", color: ink, lineHeight: 1 }}>
          DATA GOBLIN
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: "7.5px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: muted,
            marginTop: "3px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          A field guide to AI, power &amp; data in Canada
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
          height: "56px",
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
          <Menu size={24} />
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
        gap: "20px",
        height: "52px",
        padding: "0 20px",
        background: bg,
        borderBottom: `1px solid ${border}`,
        flexShrink: 0,
        zIndex: 50,
        boxShadow: c("0 1px 4px rgba(40,30,10,0.06)", "0 1px 8px rgba(0,0,0,0.35)"),
        transition: "background 0.3s",
      }}
    >
      {logo}

      <nav style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            style={({ isActive }) => ({
              fontFamily: UI,
              fontSize: "11px",
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              color: isActive ? green : muted,
              textDecoration: "none",
              padding: "6px 10px",
              borderBottom: isActive ? `2px solid ${green}` : "2px solid transparent",
              transition: "color 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            })}
          >
            <NavIcon name={l.icon} size={15} />
            {l.label}
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
          padding: "5px 10px",
        }}
      >
        <NavIcon name="search-nav" size={16} />
        <input
          type="text"
          placeholder="Search the guide…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: UI,
            fontSize: "11.5px",
            color: ink,
            width: "150px",
          }}
        />
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
          width: "30px",
          height: "30px",
          background: dyslexic ? green : "none",
          border: `1px solid ${dyslexic ? green : border}`,
          borderRadius: "3px",
          cursor: "pointer",
          color: dyslexic ? c("#f4f0e0", "#0d1018") : muted,
          fontFamily: UI,
          fontSize: "12px",
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
          width: "30px",
          height: "30px",
          background: "none",
          border: `1px solid ${border}`,
          borderRadius: "3px",
          cursor: "pointer",
          color: muted,
        }}
      >
        {dark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </header>
  );
}
