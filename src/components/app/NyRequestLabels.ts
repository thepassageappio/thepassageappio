import {
  NY_PACK_REF,
  formClassPlainLabel,
  jurisdictionPackVersionLabel,
  normalizeFormClass,
} from "@/lib/authority/jurisdiction-pack";

type RecordPins = {
  templateKey?: string | null;
  jurisdictionCode?: string | null;
  jurisdictionPackKey?: string | null;
  jurisdictionPackVersion?: string | null;
  formClass?: string | null;
};

export function resolveNyRequestLabels(record: RecordPins) {
  const showNyPack =
    record.templateKey === "ny_financial_poa"
    || record.jurisdictionCode === "US-NY"
    || Boolean(record.jurisdictionPackKey);
  const nyRulesLabel = showNyPack
    ? jurisdictionPackVersionLabel({
        displayName: NY_PACK_REF.displayName,
        packVersion: record.jurisdictionPackVersion || NY_PACK_REF.packVersion,
      })
    : null;
  const formClassPinned = record.formClass != null && String(record.formClass).length > 0;
  const formClassLabel = formClassPinned
    ? formClassPlainLabel(normalizeFormClass(record.formClass))
    : null;
  return { showNyPack, nyRulesLabel, formClassLabel };
}
