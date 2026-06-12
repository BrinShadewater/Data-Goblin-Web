import { ReactNode, useState } from "react";
import { BookOpen, ScrollText } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { useBook, useLinks, useReceipts } from "../useContent";
import { ChapterSourcesRow, ReceiptRow } from "../components/ReceiptRows";
import { StaticPageShell } from "../components/StaticPage";

// ---------------------------------------------------------------------------
// Receipts page — two tabs:
//   "Sources" (default): the book's actual receipts — every chapter's primary
//     sources, with links where they can be matched to the reference list.
//   "Verification Log": the book fact-checking ITSELF — the audit-trail
//     ledger of claims checked against primary documents.
// ---------------------------------------------------------------------------

type Tab = "sources" | "log";

export function ReceiptsPage() {
  const { c } = useTheme();
  const [tab, setTab] = useState<Tab>("sources");
  const { data: receipts, error } = useReceipts();
  const { data: book } = useBook();
  const { data: links } = useLinks();

  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const red = c(...P.red);
  const green = c(...P.green);
  const border = c(...P.borderSoft);

  const sections = receipts ? [...new Set(receipts.map((r) => r.section))] : [];
  const chapterRefs = book ? book.parts.flatMap((p) => p.chapters) : [];
  const totalChapters = chapterRefs.length || 19;

  const tabButton = (key: Tab, icon: ReactNode, label: string) => {
    const active = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        aria-pressed={active}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "9px 16px",
          background: active ? green : "transparent",
          color: active ? c("#f4f0e0", "#0d1018") : green,
          border: `1.5px solid ${green}`,
          borderRadius: RADIUS,
          cursor: "pointer",
          fontFamily: UI,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          transition: "all 0.15s",
        }}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <StaticPageShell maxWidth="860px">
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
            Data Goblin Field Guide · Receipts
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "36px", fontWeight: 900, color: navy, margin: "0 0 14px", lineHeight: 1.05, textTransform: "uppercase" }}>
            Receipts
          </h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {tabButton("sources", <BookOpen size={12} strokeWidth={2.2} />, "Sources")}
            {tabButton("log", <ScrollText size={12} strokeWidth={2.2} />, "Verification Log")}
          </div>
        </div>

        {tab === "sources" && (
          <>
            <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.65, margin: "0 0 20px" }}>
              Every chapter&rsquo;s primary sources. The goblin keeps the receipts &mdash; open a chapter to see
              what it leans on, and follow the links to read the originals yourself.
            </p>
            {!book && (
              <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Pulling the source hoard…</p>
            )}
            {chapterRefs.map((ch) => (
              <ChapterSourcesRow key={ch.number} num={ch.number} title={ch.title} links={links} />
            ))}
            {book && (
              <div style={{ fontFamily: MONO, fontSize: "9px", color: muted, marginTop: "12px" }}>
                {totalChapters} chapters · full citations live in the Source Library Appendix
                {book ? ` · as of ${book.asOf}` : ""}
              </div>
            )}
          </>
        )}

        {tab === "log" && (
          <>
            <div
              style={{
                background: c(...P.cardBg),
                border: `1px solid ${border}`,
                borderLeft: `4px solid ${green}`,
                borderRadius: RADIUS,
                padding: "13px 16px",
                marginBottom: "22px",
              }}
            >
              <p style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.65, margin: 0 }}>
                This log is the book fact-checking <em>itself</em>. Before publication (and after), every
                load-bearing claim gets pulled back out of the text and checked against primary documents.
                What you see here is the audit trail: claims verified, errors found and corrected in public,
                and the flags still open. It isn&rsquo;t errata chaos &mdash; it&rsquo;s the goblin showing
                its work, on the theory that a field guide about verifying things should let you verify the
                field guide.
              </p>
            </div>

            {error && (
              <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Could not load the verification log. ({error})</p>
            )}
            {!receipts && !error && <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Pulling receipts from the hoard…</p>}

            {sections.map((section) => {
              const items = receipts!.filter((r) => r.section === section);
              return (
                <div key={section} style={{ marginBottom: "26px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
                    <h2 style={{ fontFamily: DISPLAY, fontSize: "17px", fontWeight: 700, color: navy, margin: 0 }}>{section}</h2>
                    <span style={{ fontFamily: MONO, fontSize: "9px", color: muted }}>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {items.map((r) => (
                    <ReceiptRow key={r.id} receipt={r} />
                  ))}
                </div>
              );
            })}

            {receipts && (
              <div style={{ fontFamily: MONO, fontSize: "9px", color: muted, marginTop: "8px" }}>
                {receipts.length} ledger entries · {receipts.filter((r) => r.status === "open").length} still open ·
                covering {totalChapters} chapters{book ? ` · as of ${book.asOf}` : ""}
              </div>
            )}
          </>
        )}
    </StaticPageShell>
  );
}
