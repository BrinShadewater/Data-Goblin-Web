import type { FormEvent } from "react";
import { AlertTriangle, BookOpen, GitBranch, Mail, Send } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { CONTRIBUTION_EMAIL, CONTRIBUTION_TYPES } from "../contribute";
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
          {tr("Your email app should now have a draft addressed to")} {CONTRIBUTION_EMAIL}{tr(". Send it from there so the report reaches the guide maintainer.")}
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

export function ContributionForm({
  type,
  chapter,
  message,
  submitHovered,
  onTypeChange,
  onChapterChange,
  onMessageChange,
  onSubmitHoveredChange,
  onSubmit,
}: {
  type: string;
  chapter: string;
  message: string;
  submitHovered: boolean;
  onTypeChange: (value: string) => void;
  onChapterChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmitHoveredChange: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const green = c(...P.green);
  const red = c(...P.red);
  const inputBg = c(...P.inputBg);

  return (
    <form onSubmit={onSubmit}>
      <ContributionTypeSelector value={type} onChange={onTypeChange} />

      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "6px" }}>
          {tr("Chapter / Section")} <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{tr("(optional)")}</span>
        </label>
        <input
          type="text"
          placeholder={tr("e.g. Chapter 8, \"Jevons’ paradox\"")}
          value={chapter}
          onChange={(e) => onChapterChange(e.target.value)}
          style={{ width: "100%", background: inputBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 12px", fontFamily: UI, fontSize: "12px", color: body, outline: "none" }}
        />
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label style={{ display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "6px" }}>
          {tr("Your Report")} <span style={{ color: red }}>*</span>
        </label>
        <textarea
          required
          placeholder={tr("Describe the issue or suggestion. Include sources where applicable.")}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={6}
          style={{ width: "100%", background: inputBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "10px 12px", fontFamily: BODY, fontSize: "15px", color: body, resize: "vertical", outline: "none", lineHeight: 1.6 }}
        />
      </div>

      <button
        type="submit"
        style={{ display: "flex", alignItems: "center", gap: "8px", background: green, border: "none", borderRadius: RADIUS, padding: "10px 20px", fontFamily: UI, fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", cursor: "pointer", transition: "opacity 0.15s", opacity: submitHovered ? 0.85 : 1 }}
        onMouseEnter={() => onSubmitHoveredChange(true)}
        onMouseLeave={() => onSubmitHoveredChange(false)}
      >
        <Send size={12} />
        {tr("Submit Report")}
      </button>
    </form>
  );
}
