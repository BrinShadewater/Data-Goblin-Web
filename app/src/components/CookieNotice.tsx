import { useEffect, useState } from "react";
import { Link } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, UI } from "../theme";
import { tr } from "../i18n";

type Consent = {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  decidedAt: string;
};

const KEY = "data-goblin-cookie-consent";

function writeConsent(consent: Consent) {
  localStorage.setItem(KEY, JSON.stringify(consent));
  document.cookie = `dg_cookie_consent=${consent.analytics ? "all" : consent.preferences ? "preferences" : "essential"}; Max-Age=31536000; Path=/; SameSite=Lax`;
  try { window.dispatchEvent(new Event("dg-consent-changed")); } catch { /* no window */ }
}

function makeConsent(preferences: boolean, analytics: boolean): Consent {
  return { essential: true, preferences, analytics, decidedAt: new Date().toISOString() };
}

export function CookieNotice() {
  const { c } = useTheme();
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  const save = (pref: boolean, ana: boolean) => {
    try {
      writeConsent(makeConsent(pref, ana));
    } catch {
      /* A blocked storage context just means the banner cannot persist. */
    }
    setVisible(false);
    setManageOpen(false);
  };

  if (!visible) return null;

  const border = c(...P.border);
  const bg = c(...P.panelBg);
  const card = c(...P.cardBg);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const green = c(...P.green);
  const navy = c(...P.navy);

  const button = (label: string, onClick: () => void, primary = false) => (
    <button
      onClick={onClick}
      style={{
        background: primary ? green : "transparent",
        border: `1px solid ${primary ? green : border}`,
        borderRadius: RADIUS,
        color: primary ? c("#fffaf0", "#0d1018") : navy,
        cursor: "pointer",
        fontFamily: UI,
        fontSize: "13px",
        fontWeight: 800,
        padding: "10px 12px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: "18px",
          right: "18px",
          bottom: "18px",
          zIndex: 200,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "6px",
          boxShadow: c("0 12px 32px rgba(60,50,30,0.26)", "0 12px 32px rgba(0,0,0,0.6)"),
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "16px",
          alignItems: "center",
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: green, marginBottom: "5px" }}>
            {tr("Cookie Notice")}
          </div>
          <p style={{ fontFamily: BODY, fontSize: "14px", lineHeight: 1.55, color: body, margin: 0 }}>
            {tr("Data Goblin uses essential local storage for reading tools like notes, bookmarks, theme, and consent. No ad tracking is active. Read the")}{" "}
            <Link to="/privacy" style={{ color: navy, fontWeight: 700 }}>
              {tr("privacy policy")}
            </Link>
            .
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end", minWidth: 0 }}>
          {button(tr("Only Essential"), () => save(false, false))}
          {button(tr("Manage Preferences"), () => setManageOpen(true))}
          {button(tr("Accept All"), () => save(true, true), true)}
        </div>
      </div>

      {manageOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tr("Cookie preferences")}
          style={{ position: "fixed", inset: 0, zIndex: 210, display: "grid", placeItems: "center", background: c("rgba(35,33,26,0.38)", "rgba(0,0,0,0.62)"), padding: "18px" }}
        >
          <div style={{ width: "min(520px, 100%)", background: card, border: `1px solid ${border}`, borderRadius: "6px", padding: "20px", boxShadow: c("0 18px 48px rgba(60,50,30,0.28)", "0 18px 48px rgba(0,0,0,0.7)") }}>
            <h2 style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", color: green, margin: "0 0 12px" }}>
              {tr("Manage Preferences")}
            </h2>
            <p style={{ fontFamily: BODY, fontSize: "14px", lineHeight: 1.6, color: body, margin: "0 0 14px" }}>
              {tr("Essential storage keeps the guide functional. Optional preferences remember comfort settings. Analytics, when enabled, loads Vercel Speed Insights to measure page performance (Core Web Vitals): no cookies, no personal data, no ad tracking.")}
            </p>
            {[
              ["Essential", "Required for consent and basic reading features.", true, true] as const,
              ["Preferences", "Theme, reading mode, and other convenience settings.", preferences, false] as const,
              ["Analytics", "Privacy-preserving page-performance metrics (Core Web Vitals) via Vercel Speed Insights. No cookies, no ad tracking.", analytics, false] as const,
            ].map(([label, desc, checked, locked]) => (
              <label key={label} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${border}`, fontFamily: UI, color: body }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={(e) => {
                    if (label === "Preferences") setPreferences(e.target.checked);
                    if (label === "Analytics") setAnalytics(e.target.checked);
                  }}
                  style={{ marginTop: "3px" }}
                />
                <span>
                  <span style={{ display: "block", fontWeight: 800, color: navy, fontSize: "14px" }}>{label}</span>
                  <span style={{ display: "block", color: muted, fontSize: "13px", lineHeight: 1.45 }}>{desc}</span>
                </span>
              </label>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              {button(tr("Cancel"), () => setManageOpen(false))}
              {button(tr("Save Choices"), () => save(preferences, analytics), true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
