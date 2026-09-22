import {
  formClassPlainLabel,
  normalizeFormClass,
} from "@/lib/authority/jurisdiction-pack";
import { governingRulesLabel, snapshotObject } from "@/lib/authority/governing-snapshot";

type RecordPins = {
  templateKey?: string | null;
  jurisdictionCode?: string | null;
  jurisdictionPackKey?: string | null;
  jurisdictionPackVersion?: string | null;
  formClass?: string | null;
  governingSnapshot?: Record<string, unknown> | null;
};

export function resolveNyRequestLabels(record: RecordPins, receiptSnapshot?: Record<string, unknown>) {
  const showNyPack =
    record.templateKey === "ny_financial_poa"
    || record.jurisdictionCode === "US-NY"
    || Boolean(record.jurisdictionPackKey);
  const snapshot = receiptSnapshot === undefined ? record.governingSnapshot : snapshotObject(receiptSnapshot.governing_snapshot);
  const nyRulesLabel = showNyPack ? governingRulesLabel(snapshot) : null;
  const formClass = receiptSnapshot === undefined ? record.formClass : typeof receiptSnapshot.governing_form_class === "string" ? receiptSnapshot.governing_form_class : null;
  const formClassPinned = formClass != null && String(formClass).length > 0;
  const formClassLabel = formClassPinned
    ? formClassPlainLabel(normalizeFormClass(formClass))
    : null;
  return { showNyPack, nyRulesLabel, formClassLabel };
}
