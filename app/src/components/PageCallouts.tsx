import { useTheme } from "../ThemeContext";
import { useReader } from "../reader";
import { MONO, P, RADIUS, TOKENS } from "../theme";
import type { Trap } from "../types";
import { NavIcon } from "./GoblinMascot";

export function GoblinTrapCard({ trap }: { trap: Trap }) {
  const { c } = useTheme();
  const { t } = useReader();
  const red = c(...P.red);
  const amber = c(...P.amber);
  return (
    <div
      style={{
        background: c(...P.amberBg),
        border: `1px solid ${c(...P.amberBorder)}`,
        borderLeft: `4px solid ${amber}`,
        borderRadius: RADIUS,
        padding: "12px 15px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        margin: "14px 0",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "-4px" }}>
        <NavIcon name="alert-nav" size={TOKENS.icon.calloutTrap} />
      </span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: red, marginBottom: "4px" }}>
          Goblin Trap
        </div>
        <div
          style={{
            fontFamily: t.bodyFont,
            fontSize: `${t.callout}px`,
            fontWeight: 700,
            fontStyle: t.italicsOff ? "normal" : "italic",
            color: c(...P.ink),
            marginBottom: "5px",
            lineHeight: 1.45,
          }}
        >
          &ldquo;{trap.trapTitle}&rdquo;
        </div>
        <p style={{ fontFamily: t.bodyFont, fontSize: `${t.callout - 0.5}px`, lineHeight: t.bodyLh, letterSpacing: t.letterSpacing, color: c(...P.body), margin: 0 }}>
          {trap.text}
        </p>
      </div>
    </div>
  );
}
