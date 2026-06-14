import { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const KEY = "data-goblin-cookie-consent";

function readAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw).analytics === true : false;
  } catch {
    return false;
  }
}

/** Loads Vercel Speed Insights (Core Web Vitals) only after the visitor grants
 *  the optional "Analytics" consent in the cookie notice. Speed Insights is
 *  cookieless and collects no personal data, but we still gate it on opt-in to
 *  honour the site's privacy promise. Re-checks on the custom consent event so a
 *  fresh opt-in (or a change in another tab) takes effect without a reload. */
export function AnalyticsConsentGate() {
  const [consented, setConsented] = useState(false);
  useEffect(() => {
    const update = () => setConsented(readAnalyticsConsent());
    update();
    window.addEventListener("dg-consent-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("dg-consent-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return consented ? <SpeedInsights /> : null;
}
