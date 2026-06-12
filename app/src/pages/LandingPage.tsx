import { ArrowRight } from "lucide-react";
import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { artUrl, useBook } from "../useContent";
import { savePanel } from "../pagination";
import { preloadReaderRoute } from "../lazyRoutes";
import { NavIcon } from "../components/GoblinMascot";

const HERO_ART = "panels/insight2-panel.webp";

const QUICK_LINKS = [
  { to: "/guide", icon: "guidebook-nav", label: "Open the field guide", body: "Resume the book or start at the front matter." },
  { to: "/map", icon: "map-nav", label: "Browse the map", body: "Pick a chapter by region and question." },
  { to: "/receipts", icon: "data-nav", label: "Check receipts", body: "Open the public claim ledger." },
  { to: "/loot", icon: "chest-nav", label: "Pocket the glossary", body: "Look up the working vocabulary." },
];

const WISPS = [
  { x: 5, s: 0.75, d: -1, drift: -18 },
  { x: 10, s: 1.05, d: -8, drift: 22 },
  { x: 15, s: 0.55, d: -14, drift: -10 },
  { x: 21, s: 0.9, d: -4, drift: 18 },
  { x: 27, s: 0.65, d: -19, drift: -24 },
  { x: 32, s: 1.2, d: -11, drift: 16 },
  { x: 38, s: 0.7, d: -6, drift: -14 },
  { x: 44, s: 1.0, d: -22, drift: 26 },
  { x: 50, s: 0.58, d: -3, drift: -20 },
  { x: 56, s: 1.3, d: -16, drift: 14 },
  { x: 61, s: 0.78, d: -9, drift: -28 },
  { x: 67, s: 0.95, d: -24, drift: 20 },
  { x: 73, s: 0.6, d: -12, drift: -16 },
  { x: 79, s: 1.12, d: -5, drift: 24 },
  { x: 85, s: 0.82, d: -18, drift: -22 },
  { x: 91, s: 0.7, d: -10, drift: 12 },
  { x: 96, s: 1.0, d: -26, drift: -18 },
  { x: 2, s: 0.52, d: -21, drift: 26 },
  { x: 35, s: 0.86, d: -29, drift: -30 },
  { x: 70, s: 0.66, d: -31, drift: 30 },
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
  const wispFrame = useRef<number | null>(null);
  const wispPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (wispFrame.current !== null) {
        window.cancelAnimationFrame(wispFrame.current);
      }
    };
  }, []);

  const begin = () => {
    preloadReaderRoute();
    savePanel(1, 0);
    navigate("/chapter/1");
  };

  const moveWisps = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const root = e.currentTarget;
    wispPoint.current = { x: e.clientX, y: e.clientY };
    if (wispFrame.current !== null) return;
    wispFrame.current = window.requestAnimationFrame(() => {
      wispFrame.current = null;
      const point = wispPoint.current;
      if (!point) return;
      root.querySelectorAll<HTMLElement>("[data-wisp]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const dx = x - point.x;
        const dy = y - point.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const force = Math.max(0, 1 - dist / 170);
        el.style.setProperty("--push-x", `${(dx / dist) * force * 72}px`);
        el.style.setProperty("--push-y", `${(dy / dist) * force * 72}px`);
      });
    });
  };

  const resetWisps = (e: PointerEvent<HTMLElement>) => {
    wispPoint.current = null;
    if (wispFrame.current !== null) {
      window.cancelAnimationFrame(wispFrame.current);
      wispFrame.current = null;
    }
    e.currentTarget.querySelectorAll<HTMLElement>("[data-wisp]").forEach((el) => {
      el.style.setProperty("--push-x", "0px");
      el.style.setProperty("--push-y", "0px");
    });
  };

  return (
    <main
      onPointerMove={moveWisps}
      onPointerLeave={resetWisps}
      style={{ flex: 1, overflowY: "auto", background: bg, transition: "background 0.3s", position: "relative" }}
    >
      <style>{`
        @keyframes dg-wisp-fall {
          0% { transform: translate3d(0, -12vh, 0) scale(0.82); opacity: 0; }
          12% { opacity: 0.82; }
          34% { transform: translate3d(var(--drift), 22vh, 0) scale(1); opacity: 0.7; }
          68% { transform: translate3d(calc(var(--drift) * -0.85), 62vh, 0) scale(0.92); opacity: 0.62; }
          100% { transform: translate3d(calc(var(--drift) * 0.55), 112vh, 0) scale(0.78); opacity: 0; }
        }
        @keyframes dg-wisp-breathe {
          0%, 100% { filter: blur(0.15px); }
          50% { filter: blur(0.9px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-wisp] { display: none; }
        }
      `}</style>
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {WISPS.map((w, i) => (
          <span
            key={i}
            data-wisp
            style={{
              position: "absolute",
              left: `${w.x}%`,
              top: 0,
              width: `${9 * w.s}px`,
              height: `${9 * w.s}px`,
              transform: "translate(var(--push-x, 0), var(--push-y, 0))",
              transition: "transform 0.22s ease-out",
              ["--drift" as string]: `${w.drift}px`,
            }}
          >
            <span
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius: "999px",
                background: `radial-gradient(circle at center, ${c("#dff4ff", "#d7ffc7")} 0%, ${c("#2f80bd", "#8af66b")} 48%, transparent 76%)`,
                boxShadow: c("0 0 10px rgba(47, 128, 189, 0.72), 0 0 24px rgba(18, 72, 119, 0.34)", "0 0 12px rgba(138, 246, 107, 0.72), 0 0 26px rgba(116, 216, 86, 0.32)"),
                opacity: 0.82,
                animation: `dg-wisp-fall ${28 + i * 0.8}s ease-in-out ${w.d}s infinite, dg-wisp-breathe ${5.2 + i * 0.16}s ease-in-out ${w.d}s infinite`,
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
              onMouseEnter={preloadReaderRoute}
              onFocus={preloadReaderRoute}
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
            <Link
              to="/guide"
              onMouseEnter={preloadReaderRoute}
              onFocus={preloadReaderRoute}
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
                textDecoration: "none",
              }}
            >
              <NavIcon name="guidebook-nav" size={TOKENS.icon.landingPrimary} />
              Open the guide
            </Link>
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
            <Link
              key={item.to}
              to={item.to}
              onMouseEnter={item.to === "/guide" ? preloadReaderRoute : undefined}
              onFocus={item.to === "/guide" ? preloadReaderRoute : undefined}
              style={{
                display: "grid",
                gridTemplateColumns: `${TOKENS.icon.landingFeature}px 1fr`,
                gap: "18px",
                textAlign: "left",
                background: c(...P.cardBg),
                border: `1px solid ${border}`,
                borderRadius: RADIUS,
                padding: "16px",
                cursor: "pointer",
                minHeight: "112px",
                textDecoration: "none",
              }}
            >
              <NavIcon name={item.icon} size={TOKENS.icon.landingFeature} />
              <span>
                <span style={{ display: "block", fontFamily: UI, fontSize: "15px", fontWeight: 800, color: navy, marginBottom: "5px" }}>
                  {item.label}
                </span>
                <span style={{ display: "block", fontFamily: BODY, fontSize: "14px", lineHeight: 1.55, color: muted }}>
                  {item.body}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
