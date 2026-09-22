import assert from "node:assert/strict";
import test from "node:test";
import { participantRequirementsNotice } from "./participant-requirements-notice.ts";

test("file_received notice shows while checks remain incomplete", () => {
  assert.match(
    participantRequirementsNotice("file_received", false) ?? "",
    /waiting for the institution to review/i,
  );
});

test("file_received notice is suppressed after bank review when all checks complete", () => {
  assert.equal(participantRequirementsNotice("file_received", true), null);
});

test("certification_saved notice is not suppressed by complete checks", () => {
  assert.match(
    participantRequirementsNotice("certification_saved", true) ?? "",
    /statement was saved/i,
  );
});

test("unknown notice codes return null", () => {
  assert.equal(participantRequirementsNotice("nope", false), null);
  assert.equal(participantRequirementsNotice(undefined, false), null);
});
