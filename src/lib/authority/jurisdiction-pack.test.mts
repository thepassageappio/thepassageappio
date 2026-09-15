import assert from "node:assert/strict";
import test from "node:test";
import {
  NY_DEFAULT_TIMER_POLICY,
  NY_PACK_REF,
  formClassPlainLabel,
  jurisdictionPackVersionLabel,
  isSupportedLiveJurisdiction,
  normalizeFormClass,
  soleRefusalWarningCodes,
  NY_SOLE_REFUSAL_SOFT_NOTICE,
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

test("form_class plain labels stay short and non-jargon", () => {
  assert.equal(formClassPlainLabel("statutory_short"), "Statutory short form");
  assert.equal(formClassPlainLabel("non_statutory"), "Not a statutory short form");
  assert.equal(formClassPlainLabel("unknown"), "Form type unknown");
});

test("sole-refusal soft notice is plain language without em dashes", () => {
  assert.match(NY_SOLE_REFUSAL_SOFT_NOTICE, /statutory short form/);
  assert.doesNotMatch(NY_SOLE_REFUSAL_SOFT_NOTICE, /\u2014/);
});
