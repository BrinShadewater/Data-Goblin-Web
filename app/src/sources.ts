// Source-line classification used by the Suspicion Meter and the
// chapter receipts list. Heuristic keyword tagging — documented in the UI.

export type SourceTag =
  | "Corporate / self-disclosure"
  | "Government / official"
  | "Academic / peer-reviewed"
  | "Journalism"
  | "Civil society / advocacy"
  | "Other";

const CORP =
  /\b(google|microsoft|amazon|aws|meta\b|openai|anthropic|cohere|nvidia|telus|bell\b|shopify|ibm|oracle|apple|deepmind|scale ai|press release|newsroom|investor|blog|company announcement|corporate)\b/i;
const GOV =
  /\b(government of canada|innovation, science|ised|treasury board|statistics canada|parliament|parl\.ca|canada\.ca|budget\b|privacy commissioner|opc\b|standing committee|senate|house of commons|minister|bill c-\d+|gazette|european commission|european parliament|eu ai act|nist|white house|ontario\b.*ministry|provincial|crown)\b/i;
const ACAD =
  /\b(arxiv|university|universit[ée]|journal|nature\b|science\b|acm\b|ieee|facct|neurips|proceedings|peer.?review|institute\b|stanford|mit\b|oxford|et al\.|\(\d{4}\)\.|study|paper)\b/i;
const PRESS =
  /\b(cbc|globe and mail|toronto star|national post|reuters|bloomberg|betakit|the logic|techcrunch|financial post|ctv|global news|guardian|new york times|washington post|wired|verge|news\b|magazine)\b/i;
const CIVIL =
  /\b(cupe|union\b|coalition|advocacy|civil liberties|ccla|openmedia|first nations|fnigc|afn\b|assembly of first nations|amnesty|citizen lab|nonprofit|non-profit|foundation\b)\b/i;

/** Light/dark badge colours per source tag (shared by sidebar + Receipts page). */
export const TAG_COLORS: Record<SourceTag, { light: string; dark: string }> = {
  "Corporate / self-disclosure": { light: "#9a6510", dark: "#d9a23f" },
  "Government / official": { light: "#1a2e4a", dark: "#7ab4e8" },
  "Academic / peer-reviewed": { light: "#2d5a27", dark: "#74b85e" },
  Journalism: { light: "#7a3e6a", dark: "#c98ab8" },
  "Civil society / advocacy": { light: "#206058", dark: "#5ab8a8" },
  Other: { light: "#7c7460", dark: "#5d6878" },
};

export function classifySource(line: string): SourceTag {
  // Corporate self-disclosure first: a Google blog post about Google is
  // self-disclosure even though "blog" could appear elsewhere.
  if (CORP.test(line)) return "Corporate / self-disclosure";
  if (GOV.test(line)) return "Government / official";
  if (CIVIL.test(line)) return "Civil society / advocacy";
  if (PRESS.test(line)) return "Journalism";
  if (ACAD.test(line)) return "Academic / peer-reviewed";
  return "Other";
}

export interface Suspicion {
  /** 0..1 */
  value: number;
  label: string;
  openFlags: number;
  corporateShare: number; // 0..1
  totalSources: number;
}

/**
 * Suspicion = min(1, corporateShare + 0.4 · min(1, openVerifyFlags / 4))
 * where corporateShare (the fraction of this chapter's sources tagged corporate
 * self-disclosure) is the dominant signal, and any unresolved verify flags add
 * on top. Deterministic — not random. Reweighted 2026-06-15: the old ½/½ split
 * halved corporate reliance and leaned on a flag term that is now always 0
 * (inline VERIFY flags were all resolved into the Receipts Ledger).
 */
export function computeSuspicion(verifyFlags: string[], sources: string[]): Suspicion {
  const openFlags = verifyFlags.length;
  const flagScore = Math.min(1, openFlags / 4);
  const corp = sources.filter((s) => classifySource(s) === "Corporate / self-disclosure").length;
  const corporateShare = sources.length > 0 ? corp / sources.length : 0;
  const value = Math.min(1, corporateShare + 0.4 * flagScore);
  const label =
    value < 0.15 ? "Low Suspicion" : value < 0.35 ? "Moderate Suspicion" : value < 0.6 ? "Elevated Suspicion" : "High Suspicion";
  return { value, label, openFlags, corporateShare, totalSources: sources.length };
}
