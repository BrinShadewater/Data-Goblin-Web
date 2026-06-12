import { useState } from "react";
import { AlertTriangle, BookOpen, FileCode2, GitBranch, Mail, Send, Terminal } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, HAND, MONO, P, RADIUS, UI } from "../theme";

const CONTRIBUTION_TYPES = [
  { id: "factual", icon: <AlertTriangle size={14} />, label: "Factual Error", desc: "Something in the guide is incorrect or outdated." },
  { id: "source", icon: <BookOpen size={14} />, label: "Missing Source", desc: "A claim is made without a receipt that should have one." },
  { id: "chapter", icon: <GitBranch size={14} />, label: "Chapter Suggestion", desc: "A topic you think the guide should cover but doesn't." },
  { id: "other", icon: <Mail size={14} />, label: "General Feedback", desc: "Anything else — tone, clarity, framing, accessibility." },
];

const GUIDELINES = [
  { title: "Be specific", body: 'Name the chapter and section. "Chapter 8, the section on Jevons\' paradox" is useful. "Something seemed wrong" is not.' },
  { title: "Link your source", body: "If you're correcting a factual error, provide the source that contradicts the guide. Corrections without evidence don't get receipts." },
  { title: "Assume good faith", body: "This guide is written by humans who make mistakes. Corrections are welcome; hostility is not. We read everything." },
  { title: "You own your words", body: "Contributions may be incorporated into the guide. By submitting, you agree your suggestion can be paraphrased or adapted." },
];

const REVISION_STEPS = [
  { cmd: null, text: "Edit the manuscript markdown (DataGoblin-Complete.md) — the single source of truth for every chapter, trap, and recap." },
  { cmd: "python3 site/pipeline/build_content.py", text: "Run the content pipeline. It re-parses the manuscript, the Receipts Ledger, and the Glossary into site/content/*.json." },
  { cmd: "site/update-content.sh  (or update-content.bat)", text: "Or run the one-step update script: it runs the pipeline, copies site/content into the app's public/content, and prints a summary of what changed." },
  { cmd: null, text: "Reload the site. Chapters, traps, receipts, and glossary all render from the regenerated JSON — nothing in the app is hardcoded." },
];

export function ContributePage() {
  const { c } = useTheme();
  const [type, setType] = useState("factual");
  const [chapter, setChapter] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);

  const bg = c(...P.panelBg);
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);
  const inputBg = c(...P.inputBg);
  const noteBg = c(...P.greenBg);
  const noteBorder = c(...P.greenBorder);
  const activeBg = c("#eef2e4", "#13200f");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, padding: "32px clamp(16px, 5vw, 40px) 64px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
            Data Goblin Field Guide
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "36px", fontWeight: 900, color: navy, margin: "0 0 12px", lineHeight: 1.05, textTransform: "uppercase" }}>
            Contribute
          </h1>
          <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.7, margin: 0 }}>
            This guide is a living document. If something is wrong, outdated, or missing, tell us. Every factual
            correction makes the hoard more useful to everyone.
          </p>
        </div>

        {submitted ? (
          <div style={{ maxWidth: "600px", marginBottom: "32px" }}>
            <div style={{ background: noteBg, border: `1px solid ${noteBorder}`, borderLeft: `4px solid ${green}`, borderRadius: RADIUS, padding: "28px 32px", marginBottom: "16px" }}>
              <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: green, marginBottom: "10px" }}>
                Received
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: "24px", fontWeight: 900, color: navy, marginBottom: "12px" }}>Thank you, goblin.</div>
              <p style={{ fontFamily: BODY, fontSize: "14px", color: body, lineHeight: 1.7, margin: "0 0 12px" }}>
                Your report has been logged. We review contributions manually — if your correction is valid and
                sourced, it will be incorporated in the next revision of the relevant chapter.
              </p>
              <p style={{ fontFamily: BODY, fontSize: "13px", color: muted, lineHeight: 1.65, margin: 0 }}>
                We do not send confirmation emails. If you see the change reflected in a future version of the
                guide, that&rsquo;s your receipt.
              </p>
            </div>
            <button
              onClick={() => { setSubmitted(false); setChapter(""); setMessage(""); setType("factual"); }}
              style={{ background: "none", border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 16px", fontFamily: UI, fontSize: "11px", fontWeight: 700, color: navy, cursor: "pointer" }}
            >
              Submit another →
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "24px", alignItems: "start", marginBottom: "32px" }}>
            {/* Left: form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "8px" }}>
                  Type of Contribution
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {CONTRIBUTION_TYPES.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setType(ct.id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        background: type === ct.id ? activeBg : cardBg,
                        border: `1px solid ${type === ct.id ? green : border}`,
                        borderRadius: RADIUS,
                        padding: "10px 12px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ color: type === ct.id ? green : muted, paddingTop: "1px", flexShrink: 0 }}>{ct.icon}</span>
                      <div>
                        <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: type === ct.id ? green : body, marginBottom: "2px" }}>{ct.label}</div>
                        <div style={{ fontFamily: BODY, fontSize: "11px", color: muted, lineHeight: 1.45 }}>{ct.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "6px" }}>
                  Chapter / Section <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder='e.g. Chapter 8, "Jevons&rsquo; paradox"'
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  style={{ width: "100%", background: inputBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 12px", fontFamily: UI, fontSize: "12px", color: body, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "6px" }}>
                  Your Report <span style={{ color: red }}>*</span>
                </label>
                <textarea
                  required
                  placeholder="Describe the issue or suggestion. Include sources where applicable."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  style={{ width: "100%", background: inputBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "10px 12px", fontFamily: BODY, fontSize: "15px", color: body, resize: "vertical", outline: "none", lineHeight: 1.6 }}
                />
              </div>

              <button
                type="submit"
                style={{ display: "flex", alignItems: "center", gap: "8px", background: green, border: "none", borderRadius: RADIUS, padding: "10px 20px", fontFamily: UI, fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", cursor: "pointer", transition: "opacity 0.15s", opacity: submitHovered ? 0.85 : 1 }}
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
              >
                <Send size={12} />
                Submit Report
              </button>
            </form>

            {/* Right: guidelines + note */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>
                Guidelines
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {GUIDELINES.map((g, i) => (
                  <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "12px 14px", transition: "background 0.3s" }}>
                    <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: navy, marginBottom: "4px" }}>{g.title}</div>
                    <p style={{ fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.6, margin: 0 }}>{g.body}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: noteBg, border: `1px solid ${noteBorder}`, borderLeft: `4px solid ${green}`, borderRadius: RADIUS, padding: "12px 16px" }}>
                <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: green, marginBottom: "5px" }}>
                  A Note from the Goblin
                </div>
                <p style={{ fontFamily: BODY, fontSize: "12px", lineHeight: 1.65, color: body, margin: "0 0 8px" }}>
                  This guide is not affiliated with any institution. It is maintained by one goblin with a laptop
                  and a deep suspicion of AI press releases.
                </p>
                <div style={{ fontFamily: HAND, fontSize: "15px", color: c("#7a6040", "#8a7850"), fontStyle: "italic" }}>
                  &ldquo;Every error caught is a receipt issued.&rdquo;
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How revisions work */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderTop: `3px solid ${green}`, borderRadius: RADIUS, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <FileCode2 size={15} color={green} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: "18px", fontWeight: 800, color: navy, margin: 0 }}>How revisions work</h2>
          </div>
          <p style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.65, margin: "0 0 14px" }}>
            The website never edits content directly — everything you read here is generated from the manuscript.
            When a correction is accepted, the revision flow is:
          </p>
          <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {REVISION_STEPS.map((s, i) => (
              <li key={i} style={{ fontFamily: BODY, fontSize: "14px", color: body, lineHeight: 1.6 }}>
                {s.text}
                {s.cmd && (
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "5px", background: c("#f0ece0", "#0d1118"), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "6px 10px" }}>
                    <Terminal size={11} color={muted} style={{ flexShrink: 0 }} />
                    <code style={{ fontFamily: MONO, fontSize: "11px", color: green }}>{s.cmd}</code>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
