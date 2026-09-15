import assert from "node:assert/strict";
import test from "node:test";
import { parseInviteAccessLinkFlash } from "./invite-access-link-flash.ts";

const recordId = "11111111-1111-4111-8111-111111111111";

test("invite access link flash accepts a role-bound absolute /r/ URL for this case", () => {
  const flash = parseInviteAccessLinkFlash(
    JSON.stringify({
      recordId,
      role: "principal",
      url: "https://demo.thepassageapp.io/r/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    }),
    recordId,
  );
  assert.equal(flash?.role, "principal");
  assert.match(flash?.url ?? "", /^https:\/\/demo\.thepassageapp\.io\/r\//);
});

test("invite access link flash rejects other cases, roles, and paths", () => {
  assert.equal(
    parseInviteAccessLinkFlash(
      JSON.stringify({
        recordId: "22222222-2222-4222-8222-222222222222",
        role: "principal",
        url: "https://demo.thepassageapp.io/r/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      }),
      recordId,
    ),
    null,
  );
  assert.equal(
    parseInviteAccessLinkFlash(
      JSON.stringify({
        recordId,
        role: "owner",
        url: "https://demo.thepassageapp.io/r/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      }),
      recordId,
    ),
    null,
  );
  assert.equal(
    parseInviteAccessLinkFlash(
      JSON.stringify({
        recordId,
        role: "representative",
        url: "https://demo.thepassageapp.io/app/requests/x",
      }),
      recordId,
    ),
    null,
  );
  assert.equal(parseInviteAccessLinkFlash("not-json", recordId), null);
  assert.equal(parseInviteAccessLinkFlash(undefined, recordId), null);
});
