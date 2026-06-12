import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { MONO, P, RADIUS, TOKENS } from "../theme";

/**
 * Sidebar card. When `storageKey` is given the card is collapsible via its
 * chevron header, and the collapsed state persists per card in localStorage
 * (`goblin-card-{key}`).
 */
export function ToolCard({
  icon,
  title,
  children,
  storageKey,
  defaultOpen = true,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  storageKey?: string;
  defaultOpen?: boolean;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState<boolean>(() => {
    if (!storageKey) return true;
    try {
      const v = localStorage.getItem(`goblin-card-${storageKey}`);
      return v == null ? defaultOpen : v === "1";
    } catch {
      return defaultOpen;
    }
  });
  const toggle = () => {
    setOpen((o) => {
      if (storageKey) {
        try {
          localStorage.setItem(`goblin-card-${storageKey}`, o ? "0" : "1");
        } catch {
          /* ignore */
        }
      }
      return !o;
    });
  };
  const header = (
    <>
      {icon}
      <span style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: TOKENS.weight.toolLabel, letterSpacing: "0.18em", textTransform: "uppercase", color: c(...P.green), flex: 1, textAlign: "left" }}>
        {title}
      </span>
      {storageKey &&
        (open ? <ChevronUp size={16} color={c(...P.muted)} /> : <ChevronDown size={16} color={c(...P.muted)} />)}
    </>
  );
  return (
    <div
      style={{
        background: c(...P.cardBg),
        border: `1px solid ${c(...P.borderSoft)}`,
        borderRadius: RADIUS,
        padding: "14px 16px",
        marginBottom: "12px",
        transition: "background 0.3s",
      }}
    >
      {storageKey ? (
        <button
          onClick={toggle}
          aria-expanded={open}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            width: "100%",
            background: "none",
            border: "none",
            padding: 0,
            margin: open ? "0 0 9px" : 0,
            cursor: "pointer",
            minHeight: "30px",
          }}
        >
          {header}
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>{header}</div>
      )}
      {open && children}
    </div>
  );
}
