import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ACCOUNT_LABEL_HELP,
  ACCOUNT_LABEL_NUMBER_WARNING,
  ACCOUNT_LABEL_PLACEHOLDER,
  SAMPLE_ACCOUNT_LABEL,
  accountLabelLooksLikeNumber,
} from "./account-label-guidance.ts";

const form = readFileSync(new URL("../../app/app/requests/new/DraftRequestForm.tsx", import.meta.url), "utf8");

test("the account line steers staff away from account numbers", () => {
  assert.equal(ACCOUNT_LABEL_PLACEHOLDER, "For example, Joint checking");
  assert.equal(ACCOUNT_LABEL_HELP, "Use a name the member will recognize. Don't include account numbers.");
  for (const text of [ACCOUNT_LABEL_PLACEHOLDER, ACCOUNT_LABEL_HELP, ACCOUNT_LABEL_NUMBER_WARNING, SAMPLE_ACCOUNT_LABEL]) {
    assert.doesNotMatch(text, /\d/);
    assert.doesNotMatch(text, /\u2014|\u2013/);
    assert.doesNotMatch(text, /ending/i);
  }
  assert.doesNotMatch(form, /ending \d{4}/, "no partial account number examples left in the form");
  assert.match(form, /aria-describedby="account-boundary-help"/);
});

test("the number warning is soft and only flags four or more digits", () => {
  assert.equal(accountLabelLooksLikeNumber("Joint checking"), false);
  assert.equal(accountLabelLooksLikeNumber("Checking 12"), false);
  assert.equal(accountLabelLooksLikeNumber("Checking ending 4821"), true);
  assert.equal(accountLabelLooksLikeNumber("Savings 48-21"), true);
  assert.doesNotMatch(form, /disabled=\{[^}]*accountLabelLooksLikeNumber/, "the warning never blocks saving");
});

test("no account-number prefill is left in request forms or the sandbox fixture", () => {
  const sandboxForm = readFileSync(new URL("../../app/institution/new/page.tsx", import.meta.url), "utf8");
  const fixture = readFileSync(new URL("./fixture.ts", import.meta.url), "utf8");
  for (const source of [form, sandboxForm, fixture]) {
    assert.doesNotMatch(source, /4821|ending \d{4}|ending in/i);
  }
  assert.match(sandboxForm, /ACCOUNT_LABEL_HELP/);
});
