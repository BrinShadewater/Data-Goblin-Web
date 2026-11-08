import type { Lang } from "./LanguageContext";
import notes from "./receiptNotes.json";

// Reader-facing notes supplement the generated ledger without rewriting its history.
type ReceiptNote = Record<Lang, { detail: string; sourceLabel: string; url: string }> & {
  passage?: { chapter: number; section: string };
};

export const RECEIPT_NOTES: Partial<Record<number, ReceiptNote>> = notes;
