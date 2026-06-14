import { useState, type FormEvent } from "react";
import { AlertTriangle, BookOpen, GitBranch, Mail, Send } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { CONTRIBUTION_TYPES, buildContributionMailto, contributionTypeLabel } from "../contribute";
import { tr } from "../i18n";

const CONTRIBUTION_TYPE_ICONS = {
  factual: <AlertTriangle size={14} />,
  source: <BookOpen size={14} />,
  chapter: <GitBranch size={14} />,
  other: <Mail size={14} />,
};

export function ContributionSuccess({ onReset }: { onReset: () => void }) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const noteBg = c(...P.greenBg);
  const noteBorder = c(...P.greenBorder);

  return (
    <div style={{ maxWidth: "600px", marginBottom: "32px" }}>
      <div style={{ background: noteBg, border: `1px solid ${noteBorder}`, borderLeft: `4px solid ${green}`, borderRadius: RADIUS, padding: "28px 32px", marginBottom: "16px" }}>
        <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: green, marginBottom: "10px" }}>
          {tr("Received")}
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: "24px", fontWeight: 900, color: navy, marginBottom: "12px" }}>{tr("Thank you, goblin.")}</div>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: body, lineHeight: 1.7, margin: "0 0 12px" }}>
          {tr("Your report was sent to the guide maintainer.")}
        </p>
        <p style={{ fontFamily: BODY, fontSize: "13px", color: muted, lineHeight: 1.65, margin: 0 }}>
          {tr("Contributions are reviewed manually. If a correction is valid and sourced, it can be incorporated in a future revision of the relevant chapter.")}
        </p>
      </div>
      <button
        onClick={onReset}
        style={{ background: "none", border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 16px", fontFamily: UI, fontSize: "11px", fontWeight: 700, color: navy, cursor: "pointer" }}
      >
        {tr("Submit another →")}
      </button>
    </div>
  );
}

export function ContributionTypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { c } = useTheme();
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const green = c(...P.green);
  const activeBg = c("#eef2e4", "#13200f");

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "8px" }}>
        {tr("Type of Contribution")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {CONTRIBUTION_TYPES.map((ct) => (
          <button
            key={ct.id}
            type="button"
            onClick={() => onChange(ct.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: value === ct.id ? activeBg : cardBg,
              border: `1px solid ${value === ct.id ? green : border}`,
              borderRadius: RADIUS,
              padding: "10px 12px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <span style={{ color: value === ct.id ? green : muted, paddingTop: "1px", flexShrink: 0 }}>{CONTRIBUTION_TYPE_ICONS[ct.id]}</span>
            <div>
              <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: value === ct.id ? green : body, marginBottom: "2px" }}>{tr(ct.label)}</div>
              <div style={{ fontFamily: BODY, fontSize: "11px", color: muted, lineHeight: 1.45 }}>{tr(ct.desc)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Self-contained Contribute form: POSTs JSON to the /api/contribute serverless
 *  function (Resend email). Calls onSuccess() once the report is accepted. */
export function ContributionForm({ onSuccess }: { onSuccess: () => void }) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const green = c(...P.green);
  const red = c(...P.red);
  const navy = c(...P.navy);
  const inputBg = c(...P.inputBg);

  const [type, setType] = useState("factual");
  const [chapter, setChapter] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — humans never see this
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  const labelStyle = { display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: muted, marginBottom: "6px" };
  const optional = <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{tr("(optional)")}</span>;
  const inputStyle = { width: "100%", boxSizing: "border-box" as const, background: inputBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 12px", fontFamily: UI, fontSize: "12px", color: body, outline: "none" };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionType: contributionTypeLabel(type),
          section: chapter,
          report: message,
          sourceUrl,
          email,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { onSuccess(); return; }
      setError(typeof data.error === "string" ? data.error : "Something went wrong.");
      setStatus("idle");
    } catch {
      setError("Could not reach the server. Please try again.");
      setStatus("idle");
    }
  };

  const submitting = status === "submitting";

  return (
    <form onSubmit={submit}>
      <ContributionTypeSelector value={type} onChange={setType} />

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>{tr("Chapter / Section")} {optional}</label>
        <input type="text" placeholder={tr("e.g. Chapter 8, \"Jevons’ paradox\"")} value={chapter} onChange={(e) => setChapter(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>{tr("Source URL")} {optional}</label>
        <input type="url" inputMode="url" placeholder="https://…" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>{tr("Your Email")} {optional}</label>
        <input type="email" inputMode="email" placeholder={tr("So we can reply or credit you")} value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label style={labelStyle}>{tr("Your Report")} <span style={{ color: red }}>*</span></label>
        <textarea
          required
          placeholder={tr("Describe the issue or suggestion. Include sources where applicable.")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          style={{ ...inputStyle, fontFamily: BODY, fontSize: "15px", resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {/* Honeypot: hidden from humans, tempting to bots. A filled value is silently dropped server-side. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <div style={{ marginBottom: "12px", fontFamily: UI, fontSize: "13px", color: red, lineHeight: 1.5 }}>
          {tr(error)}{" "}
          <a href={buildContributionMailto({ type, chapter, message })} style={{ color: navy, fontWeight: 700 }}>
            {tr("Email it directly instead →")}
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{ display: "flex", alignItems: "center", gap: "8px", background: green, border: "none", borderRadius: RADIUS, padding: "10px 20px", fontFamily: UI, fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", cursor: submitting ? "wait" : "pointer", transition: "opacity 0.15s", opacity: submitting ? 0.7 : hover ? 0.85 : 1 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Send size={12} />
        {submitting ? tr("Sending…") : tr("Submit Report")}
      </button>
    </form>
  );
}
