import { useRef, useState } from "react";
import { useHref } from "react-router";
import { Link } from "../i18nNav";
import { langPath, useLanguage } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { sectionHref, type SectionLink } from "../sectionLinks";
import { P, UI } from "../theme";

const COPY = {
  en: { outline: "In this chapter", close: "Close", copy: "Copy link", copied: "Section link copied.", failed: "Copy failed. You can copy the section link from its menu." },
  fr: { outline: "Dans ce chapitre", close: "Fermer", copy: "Copier le lien", copied: "Lien de la section copié.", failed: "La copie a échoué. Vous pouvez copier le lien depuis son menu." },
};

function SectionRow({ number, section, current, close, announce }: {
  number: number;
  section: SectionLink;
  current: boolean;
  close: () => void;
  announce: (message: string) => void;
}) {
  const { lang } = useLanguage();
  const { c } = useTheme();
  const copy = COPY[lang];
  const to = sectionHref(number, section.id);
  const href = useHref(langPath(to, lang));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.href).href);
      announce(copy.copied);
    } catch {
      announce(copy.failed);
    }
  }

  return (
    <li style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${c(...P.borderSoft)}` }}>
      <Link to={to} state={{ focusSection: true }} onClick={close} aria-current={current ? "location" : undefined}
        style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 44, padding: "8px 0", color: c(...P.navy),
          fontWeight: current ? 800 : 600, overflowWrap: "anywhere" }}>
        {section[lang]}
      </Link>
      <button type="button" onClick={copyLink} aria-label={`${copy.copy} · ${section[lang]}`}
        style={{ flexShrink: 0, minHeight: 44, maxWidth: "40%", padding: "0 8px", color: c(...P.navy),
          background: c(...P.pageBg), border: `1px solid ${c(...P.border)}`, borderRadius: 4, cursor: "pointer" }}>
        {copy.copy}
      </button>
    </li>
  );
}

export function ChapterOutline({ number, sections, activeId }: {
  number: number;
  sections: SectionLink[];
  activeId?: string;
}) {
  const { lang } = useLanguage();
  const { c } = useTheme();
  const copy = COPY[lang];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => {
        setMessage("");
        dialogRef.current?.showModal();
      }} style={{ minHeight: 44, maxWidth: 105, padding: "0 4px", color: c(...P.navy),
        background: "transparent", border: 0, cursor: "pointer", font: `700 12px/1.2 ${UI}` }}>
        {copy.outline}
      </button>
      <dialog ref={dialogRef} aria-label={copy.outline}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.stopPropagation();
        }}
        style={{ width: "min(92vw, 520px)", maxHeight: "min(85dvh, 650px)", padding: 16,
          boxSizing: "border-box", background: c(...P.panelBg), color: c(...P.ink),
          border: `1px solid ${c(...P.border)}`, borderRadius: 6, fontFamily: UI }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>{copy.outline}</h2>
          <button type="button" onClick={close} style={{ minHeight: 44, padding: "0 10px", color: c(...P.ink),
            background: c(...P.pageBg), border: `1px solid ${c(...P.border)}`, borderRadius: 4, cursor: "pointer" }}>{copy.close}</button>
        </div>
        <ol style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
          {sections.map((section) => (
            <SectionRow key={section.id} number={number} section={section} current={section.id === activeId}
              close={close} announce={setMessage} />
          ))}
        </ol>
        <p role="status" style={{ margin: 0 }}>{message}</p>
      </dialog>
    </>
  );
}
