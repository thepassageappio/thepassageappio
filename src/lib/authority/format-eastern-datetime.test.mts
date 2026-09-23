import assert from "node:assert/strict";
import test from "node:test";
import { formatEasternDateTime } from "./format-eastern-datetime.ts";

test("formatEasternDateTime includes Eastern zone abbreviation", () => {
  const formatted = formatEasternDateTime("2026-09-23T03:45:00.000Z");
  assert.match(formatted, /September 22, 2026/);
  assert.match(formatted, /11:45\s*PM/i);
  assert.match(formatted, /\b(EDT|EST|Eastern)\b/i);
});

test("formatEasternDateTime staff Full history path shows EDT in summer", () => {
  // Same instant QA captured as staff "Sep 22, 11:45 PM" (UTC) vs PAR "7:45 PM EDT"
  const formatted = formatEasternDateTime("2026-09-23T03:45:00.000Z");
  assert.match(formatted, /\bEDT\b/);
  assert.doesNotMatch(formatted, /^Sep /); // long month for institution/participant parity
});

test("formatEasternDateTime shows EST in winter", () => {
  const formatted = formatEasternDateTime("2026-01-15T18:30:00.000Z");
  assert.match(formatted, /January 15, 2026/);
  assert.match(formatted, /1:30\s*PM/i);
  assert.match(formatted, /\bEST\b/);
});
