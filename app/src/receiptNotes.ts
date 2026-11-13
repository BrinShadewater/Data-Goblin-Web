import type { Lang } from "./LanguageContext";
import notes from "./receiptNotes.json";

// Reader-facing notes supplement the generated ledger without rewriting its history.
type ReceiptNote = Partial<Record<Lang, { detail: string; sourceLabel: string; url: string }>> & {
  passage?: { chapter: number; section: string; exact?: boolean };
  review?: Record<Lang, string> & { date: string };
};

export const RECEIPT_NOTES: Partial<Record<number, ReceiptNote>> = notes;
