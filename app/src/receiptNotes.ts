import type { Lang } from "./LanguageContext";

const resultsUrl = "https://arxiv.org/html/2512.13915v1#S4";

// Reader-facing notes supplement the generated ledger without rewriting its history.
export const RECEIPT_NOTES: Partial<Record<number, Record<Lang, { detail: string; sourceLabel: string; url: string }>>> = {
  32: {
    en: {
      detail: "In the study’s sample of posts about the 2025 Canadian federal election, politically harmful deepfakes accounted for 0.12% of all views on X. The authors compared view counts six months after posting. In a separate comparison of images, the study flagged 8.66% from right-leaning accounts and 4.42% from left-leaning accounts as deepfakes.",
      sourceLabel: "Read the study’s results",
      url: resultsUrl,
    },
    fr: {
      detail: "Dans l’échantillon de publications sur les élections fédérales canadiennes de 2025, les hypertrucages politiquement préjudiciables représentaient 0,12 % de toutes les vues sur X. L’équipe a comparé les nombres de vues six mois après la publication. Dans une analyse distincte des images, elle a détecté des hypertrucages dans 8,66 % des images des comptes de droite et dans 4,42 % de celles des comptes de gauche.",
      sourceLabel: "Lire les résultats de l’étude (en anglais)",
      url: resultsUrl,
    },
  },
};
