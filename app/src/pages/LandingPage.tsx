import { ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { artUrl, useBook } from "../useContent";
import { savePanel } from "../pagination";
import { NavIcon } from "../components/GoblinMascot";

const HERO_ART = "panels/insight2-panel.webp";

const QUICK_LINKS = [
  { to: "/guide", icon: "guidebook-nav", label: "Open the field guide", body: "Resume the book or start at the front matter." },
  { to: "/map", icon: "map-nav", label: "Browse the map", body: "Pick a chapter by region and question." },
  { to: "/receipts", icon: "data-nav", label: "Check receipts", body: "Open the public claim ledger." },
  { to: "/loot", icon: "chest-nav", label: "Pocket the glossary", body: "Look up the working vocabulary." },
];

const WISPS = [
  { x: 7, y: 8, s: 0.8, d: -1 },
  { x: 12, y: 36, s: 1.1, d: -6 },
  { x: 18, y: 72, s: 0.7, d: -11 },
  { x: 23, y: 19, s: 0.95, d: -4 },
  { x: 29, y: 53, s: 0.65, d: -9 },
  { x: 34, y: 83, s: 1.2, d: -2 },
  { x: 41, y: 31, s: 0.75, d: -13 },
  { x: 47, y: 67, s: 1.05, d: -7 },
  { x: 52, y: 11, s: 0.6, d: -3 },
  { x: 59, y: 44, s: 1.3, d: -12 },
  { x: 64, y: 78, s: 0.8, d: -5 },
  { x: 71, y: 22, s: 1.0, d: -10 },
  { x: 76, y: 58, s: 0.7, d: -15 },
  { x: 82, y: 39, s: 1.15, d: -8 },
  { x: 88, y: 74, s: 0.9, d: -14 },
  { x: 94, y: 17, s: 0.65, d: -6 },
  { x: 5, y: 61, s: 0.55, d: -16 },
  { x: 36, y: 6, s: 0.7, d: -18 },
  { x: 69, y: 91, s: 0.95, d: -17 },
  { x: 97, y: 52, s: 0.8, d: -19 },
];

export function LandingPage() {
  const { c, dark } = useTheme();
  const navigate = useNavigate();
  const { data: book } = useBook();

  const bg = c(...P.panelBg);
  const page = c(...P.pageBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);

  const begin = () => {
    savePanel(1, 0);
    navigate("/chapter/1");
  };

  const moveWisps = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    e.currentTarget.querySelectorAll<HTMLElement>("[data-wisp]").forEach((el) => {
      const x = (Number(el.dataset.x) / 100) * rect.width;
      const y = (Number(el.dataset.y) / 100) * rect.height;
      const dx = x - mx;
      const dy = y - my;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const force = Math.max(0, 1 - dist / 190);
      el.style.transform = `translate(${(dx / dist) * force * 68}px, ${(dy / dist) * force * 68}px)`;
    });
  };

  const resetWisps = (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.querySelectorAll<HTMLElement>("[data-wisp]").forEach((el) => {
      el.style.transform = "translate(0, 0)";
    });
  };

  return (
    <main
      onMouseMove={moveWisps}
      onMouseLeave={resetWisps}
      style={{ flex: 1, overflowY: "auto", background: bg, transition: "background 0.3s", position: "relative" }}
    >
      <style>{`
        @keyframes dg-wisp-fall {
          0% { transform: translate3d(-10px, -42px, 0) scale(0.7); opacity: 0; }
          14% { opacity: 0.78; }
          48% { transform: translate3d(12px, 78px, 0) scale(1); opacity: 0.62; }
          100% { transform: translate3d(-8px, 178px, 0) scale(0.82); opacity: 0; }
        }
        @keyframes dg-wisp-breathe {
          0%, 100% { filter: blur(0.15px); }
          50% { filter: blur(0.9px); }
        }
      `}</style>
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {WISPS.map((w, i) => (
          <span
            key={i}
            data-wisp
            data-x={w.x}
            data-y={w.y}
            style={{
              position: "absolute",
              left: `${w.x}%`,
              top: `${w.y}%`,
              width: `${8 * w.s}px`,
              height: `${8 * w.s}px`,
              transition: "transform 0.28s ease-out",
            }}
          >
            <span
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius: "999px",
                background: `radial-gradient(circle at center, ${c("#e9fbff", "#d7ffc7")} 0%, ${c("#8fd7ff", "#8af66b")} 46%, transparent 76%)`,
                boxShadow: c("0 0 10px rgba(111, 190, 255, 0.62), 0 0 22px rgba(77, 152, 210, 0.26)", "0 0 12px rgba(138, 246, 107, 0.72), 0 0 26px rgba(116, 216, 86, 0.32)"),
                opacity: 0.82,
                animation: `dg-wisp-fall ${15 + i * 0.45}s linear ${w.d}s infinite, dg-wisp-breathe ${3.8 + i * 0.12}s ease-in-out ${w.d}s infinite`,
              }}
            />
          </span>
        ))}
      </div>
      <section
        style={{
          minHeight: "calc(100dvh - 72px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          alignItems: "center",
          gap: "clamp(28px, 5vw, 72px)",
          padding: "clamp(28px, 5vw, 68px)",
          maxWidth: "1480px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "12px" }}>
            Free interactive web book · {book?.asOf ?? "June 2026"}
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(48px, 7vw, 92px)", fontWeight: 900, color: navy, margin: "0 0 12px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {book?.title ?? "Data Goblin"}
          </h1>
          <p style={{ fontFamily: DISPLAY, fontSize: "clamp(21px, 2.3vw, 34px)", fontStyle: "italic", color: c(...P.ink), margin: "0 0 24px", lineHeight: 1.22 }}>
            {book?.subtitle ?? "A Field Guide to AI, Power, and Data in Canada"}
          </p>
          <p style={{ fontFamily: BODY, fontSize: "18px", lineHeight: 1.7, color: body, maxWidth: "760px", margin: "0 0 28px" }}>
            A plain-language manual for reading AI claims in Canada: who counted what, who benefits,
            what is still contested, and where the receipts live.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <button
              onClick={begin}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: green,
                border: `1px solid ${c(...P.greenDeep)}`,
                borderRadius: RADIUS,
                color: c("#fffaf0", "#0d1018"),
                cursor: "pointer",
                fontFamily: UI,
                fontSize: "15px",
                fontWeight: 800,
                padding: "14px 18px",
              }}
            >
              Begin with Chapter 1
              <ArrowRight size={41} />
            </button>
            <button
              onClick={() => navigate("/guide")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                background: "transparent",
                border: `1px solid ${green}`,
                borderRadius: RADIUS,
                color: green,
                cursor: "pointer",
                fontFamily: UI,
                fontSize: "15px",
                fontWeight: 800,
                padding: "14px 18px",
              }}
            >
              <NavIcon name="guidebook-nav" size={50} />
              Open the guide
            </button>
          </div>
        </div>

        <div
          style={{
            background: page,
            border: `1px solid ${border}`,
            borderRadius: "6px",
            boxShadow: c("0 18px 48px rgba(60,50,30,0.24)", "0 18px 48px rgba(0,0,0,0.55)"),
            padding: "clamp(18px, 3vw, 34px)",
            minWidth: 0,
          }}
        >
          <img
            src={artUrl(HERO_ART)}
            alt="Data Goblin inspecting a trail of receipts and glowing evidence crystals"
            decoding="async"
            style={{
              display: "block",
              width: "100%",
              maxHeight: "58dvh",
              objectFit: "contain",
              mixBlendMode: dark ? "normal" : "multiply",
              opacity: dark ? 0.92 : 1,
            }}
          />
        </div>
      </section>

      <section style={{ maxWidth: "1480px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 68px) 56px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" }}>
          {QUICK_LINKS.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              style={{
                display: "grid",
                gridTemplateColumns: "77px 1fr",
                gap: "18px",
                textAlign: "left",
                background: c(...P.cardBg),
                border: `1px solid ${border}`,
                borderRadius: RADIUS,
                padding: "16px",
                cursor: "pointer",
                minHeight: "112px",
              }}
            >
              <NavIcon name={item.icon} size={77} />
              <span>
                <span style={{ display: "block", fontFamily: UI, fontSize: "15px", fontWeight: 800, color: navy, marginBottom: "5px" }}>
                  {item.label}
                </span>
                <span style={{ display: "block", fontFamily: BODY, fontSize: "14px", lineHeight: 1.55, color: muted }}>
                  {item.body}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
