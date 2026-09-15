import assert from "node:assert/strict";
import test from "node:test";
import {
  NY_DEFAULT_TIMER_POLICY,
  NY_PACK_REF,
  jurisdictionPackVersionLabel,
  isSupportedLiveJurisdiction,
  normalizeFormClass,
  soleRefusalWarningCodes,
} from "./jurisdiction-pack.ts";

test("NY pack defaults match Phase 0 10 BD then 7 BD timer policy", () => {
  assert.equal(NY_PACK_REF.jurisdictionCode, "US-NY");
  assert.equal(NY_PACK_REF.packKey, "us_ny_financial_poa");
  assert.equal(NY_PACK_REF.packVersion, "2026.1");
  assert.equal(NY_DEFAULT_TIMER_POLICY.initialBusinessDays, 10);
  assert.equal(NY_DEFAULT_TIMER_POLICY.followupBusinessDays, 7);
});

test("live claims stay NY-only", () => {
  assert.equal(isSupportedLiveJurisdiction("US-NY"), true);
  assert.equal(isSupportedLiveJurisdiction("US-PA"), false);
  assert.equal(isSupportedLiveJurisdiction(null), false);
});

test("form_class normalizes unknown values without inventing statutory short", () => {
  assert.equal(normalizeFormClass("statutory_short"), "statutory_short");
  assert.equal(normalizeFormClass("nope"), "unknown");
  assert.equal(normalizeFormClass(undefined), "unknown");
});

test("sole refusal warnings only fire for statutory short form with a single warn code", () => {
  assert.deepEqual(
    soleRefusalWarningCodes({
      formClass: "statutory_short",
      reasonCodes: ["ny.warn.not_our_form_alone"],
    }),
    ["ny.warn.not_our_form_alone"],
  );
  assert.deepEqual(
    soleRefusalWarningCodes({
      formClass: "non_statutory",
      reasonCodes: ["ny.warn.age_alone"],
    }),
    [],
  );
  assert.deepEqual(
    soleRefusalWarningCodes({
      formClass: "statutory_short",
      reasonCodes: ["ny.warn.age_alone", "ny.reasonable_cause.scope"],
    }),
    [],
  );
});

test("pack version label is plain language for staff surfaces", () => {
  assert.equal(
    jurisdictionPackVersionLabel(NY_PACK_REF),
    "New York financial power of attorney · pack 2026.1",
  );
});
