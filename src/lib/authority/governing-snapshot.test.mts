import { test } from "node:test";
import assert from "node:assert/strict";
import { governingRulesLabel, governingSnapshotChanges, mapGoverningContext } from "./governing-snapshot.ts";

test("historical missing snapshots never claim current rules", () => {
  assert.match(governingRulesLabel(null), /not saved/);
  assert.match(governingRulesLabel({ pack_version: "2026.1" }), /not saved/);
  assert.equal(governingRulesLabel({ display_name: "Saved NY rules", pack_version: "2026.1" }), "Saved NY rules · version 2026.1");
});
test("review diff shows changes, additions and removals with previous values", () => {
  assert.deepEqual(governingSnapshotChanges({initial_business_days: 10, notes: "Old"}, {initial_business_days: 12, source_citation: "New"}), [
    {label:"Initial review days",before:"10",after:"12"},
    {label:"Notes",before:"Old",after:"Removed"},
    {label:"Source",before:"Not recorded",after:"New"},
  ]);
});
test("missing context fails closed and malformed review hashes cannot be submitted", () => {
  assert.throws(() => mapGoverningContext(null), /configuration_unavailable/);
  assert.equal(mapGoverningContext({stale:true,current_hash:"wrong"}).currentHash, null);
  assert.equal(mapGoverningContext({stale:true,current_hash:"a".repeat(64)}).currentHash, "a".repeat(64));
});
