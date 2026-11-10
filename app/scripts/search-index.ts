import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import type { Book, Chapter, GlossaryEntry } from "../src/types.ts";
import type { Lang } from "../src/LanguageContext.tsx";
import { sectionBodyTerms, sectionSearchTerms, type SearchHit } from "../src/search.ts";
import type { SectionLinks } from "../src/sectionLinks.ts";
import { TOPIC_LIST } from "../src/topics.ts";
import fr from "../src/ui-fr.ts";

const topicSearchLabels: Record<string, Record<Lang, string>> = {
  "data-centres": { en: "Data-centre water use", fr: "Eau et centres de données" },
  sovereignty: { en: "Digital sovereignty", fr: "Souveraineté numérique" },
  deepfakes: { en: "Deepfakes", fr: "Hypertrucages" },
};

const sectionKeywords: Record<string, Record<Lang, string>> = {
  "3/the-human-labour-layer": {
    en: "human workers label labeling labelling annotation tagging train training data AI",
    fr: "travailleurs humains étiquettent étiquette étiquetage annotation données entraînement entraîner IA",
  },
  "6/the-transparency-gap-in-operational-terms": {
    en: "Canadian data centre water use reporting report disclosure WUE",
    fr: "centres données canadiens déclarent consommation eau déclaration WUE",
  },
  "8/training-versus-inference-the-most-important-environmental-distinction": {
    en: "AI model running training inference energy use electricity consumption",
    fr: "modèle IA utilisation entraînement inférence énergie électricité consommation consomme",
  },
  "9/national-sovereignty-the-cloud-act-problem": {
    en: "US authorities access data stored in Canada CLOUD Act",
    fr: "autorités américaines accès accéder données stockées Canada loi CLOUD",
  },
  "9/indigenous-data-sovereignty-the-deeper-layer": {
    en: "OCAP principles Indigenous data governance ownership control access possession",
    fr: "PCAP principes données autochtones propriété contrôle accès possession",
  },
  "10/the-biometric-and-facial-recognition-layer": {
    en: "Canadian Canada police use facial recognition biometric Clearview RCMP",
    fr: "Canada police utiliser reconnaissance faciale biométrie Clearview GRC",
  },
  "13/bill-c-16-what-it-covers": {
    en: "deepfake removal removing takedown 48 hour deadline start court order",
    fr: "hypertrucage retrait retirer 48 heures délai commence ordonnance tribunal",
  },
};

const plain = (value: string, length: number) => value
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/[*_>#`]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, length);

function buildIndex(root: string, lang: Lang) {
  function read<T>(file: string): T {
    return JSON.parse(readFileSync(resolve(root, "public/content", lang === "fr" ? "fr" : "", file), "utf8"));
  }
  const book = read<Book>("book.json");
  const sectionLinks = JSON.parse(readFileSync(resolve(root, "public/content/section-links.json"), "utf8")) as SectionLinks;
  const chapterNumbers = book.parts.flatMap((part) => part.chapters.map(({ number }) => number));
  const extraNumbers = [book.frontMatter?.number, book.backMatter?.number].filter((number) => number !== undefined);
  const hits: SearchHit[] = TOPIC_LIST.map(({ slug, title, blurb }) => {
    const label = topicSearchLabels[slug]?.[lang];
    const description = lang === "fr" ? fr[blurb] ?? blurb : blurb;
    return { type: "topic", slug, title: label ?? (lang === "fr" ? fr[title] ?? title : title), snippet: description };
  });
  for (const number of [...chapterNumbers, ...extraNumbers]) {
    const chapter = read<Chapter>(`chapters/ch${String(number).padStart(2, "0")}.json`);
    const links = sectionLinks[number];
    if (!links || links.length !== chapter.sections.length
      || new Set(links.map(({ id }) => id)).size !== links.length
      || new Set(chapter.sections.map(({ heading }) => heading)).size !== chapter.sections.length
      || links.some((link, index) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(link.id) || link[lang] !== chapter.sections[index].heading)) {
      throw new Error(`Chapter ${number} (${lang}) does not match section-links.json. Keep published IDs when updating the headings.`);
    }
    if (!chapterNumbers.includes(number)) continue;
    const title = chapter.title.split(" — ")[0];
    hits.push({ type: "chapter", num: number, title: chapter.title, snippet: plain(chapter.startHere, 160) });
    for (const [index, section] of chapter.sections.entries()) {
      const sectionId = links[index].id;
      const keywords = sectionKeywords[`${number}/${sectionId}`]?.[lang];
      hits.push({
        type: "section", num: number, chapterTitle: title, heading: section.heading,
        snippet: plain(section.markdown, 220), sectionId,
        terms: sectionBodyTerms(plain(section.markdown, Infinity), lang),
        ...(keywords && { keywords: sectionSearchTerms(keywords, lang) }),
      });
    }
  }
  for (const { term, def, letter } of read<GlossaryEntry[]>("glossary.json")) {
    hits.push({ type: "glossary", term, def, letter });
  }
  return JSON.stringify(hits);
}

export function searchIndexPlugin(): Plugin {
  let root: string;
  return {
    name: "guide-search-index",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const match = request.url?.match(/^\/search\/(en|fr)\.json$/);
        if (!match) return next();
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(buildIndex(root, match[1] as Lang));
      });
    },
    generateBundle() {
      for (const lang of ["en", "fr"] as const) {
        this.emitFile({ type: "asset", fileName: `search/${lang}.json`, source: buildIndex(root, lang) });
      }
    },
  };
}
