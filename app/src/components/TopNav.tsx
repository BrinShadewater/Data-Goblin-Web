import { Moon, Search, Sun } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { DISPLAY, MONO, P, UI } from "../theme";
import { GoblinIcon } from "./GoblinMascot";

const LINKS: { to: string; label: string }[] = [
  { to: "/", label: "Field Guide" },
  { to: "/map", label: "Map" },
  { to: "/loot", label: "Loot (Glossary)" },
  { to: "/receipts", label: "Receipts" },
  { to: "/about", label: "About" },
  { to: "/contribute", label: "Contribute" },
];

export function TopNav({
  searchQuery,
  onSearch,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
}) {
  const { c, dark, toggle } = useTheme();
  const navigate = useNavigate();
  const bg = c(...P.panelBg);
  const border = c(...P.border);
  const ink = c(...P.ink);
  const green = c(...P.green);
  const muted = c(...P.muted);

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
      <button
        onClick={() => navigate("/")}
        style={{ display: "flex", alignItems: "center", gap: "9px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        aria-label="Data Goblin home"
      >
        <GoblinIcon size={26} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 800, fontSize: "16px", color: ink, lineHeight: 1 }}>
            DATA GOBLIN
          </div>
          <div style={{ fontFamily: MONO, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: muted, marginTop: "3px" }}>
            A field guide to AI, power &amp; data in Canada
          </div>
        </div>
      </button>

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
            })}
          >
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
        <Search size={13} color={muted} strokeWidth={2} />
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
