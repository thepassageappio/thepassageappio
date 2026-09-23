import assert from "node:assert/strict";
import test from "node:test";
import { formatEasternDateTime } from "./format-eastern-datetime.ts";

test("formatEasternDateTime includes Eastern zone abbreviation", () => {
  const formatted = formatEasternDateTime("2026-09-23T03:45:00.000Z");
  assert.match(formatted, /September 22, 2026/);
  assert.match(formatted, /11:45\s*PM/i);
  assert.match(formatted, /\b(EDT|EST|Eastern)\b/i);
});
