import assert from "node:assert/strict";
import test from "node:test";
import { buildCaseOrientation, buildDocumentReviewModel, participantBankOnlyLinkLine } from "./orientation-strip.ts";
import type { HostedAuthorityRecord } from "./hosted-records.ts";
import type { HostedInstitutionDecision } from "./hosted-decisions.ts";

const baseRecord: HostedAuthorityRecord = {
  id: "rec-1",
  referenceCode: "PA-TEST",
  organizationId: "org-1",
  createdBy: "user-1",
  version: 1,
  status: "under_review",
  templateKey: "ny_financial_poa",
  templateVersion: "1",
  purpose: "financial_poa",
  accountBoundary: "Checking ****1234",
  principalName: "Alex Account",
  principalEmail: "alex@example.com",
  representativeName: "Riley Rep",
  representativeEmail: "riley@example.com",
  allowedActionKeys: ["receive_duplicate_statements"],
  validUntil: "2030-01-01T00:00:00.000Z",
  activatedAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  originGroupId: null,
  jurisdictionCode: null, jurisdictionPackKey: null, jurisdictionPackVersion: null, formClass: null,
};

test("under review answers five questions without a decision", () => {
  const model = buildCaseOrientation({
    record: baseRecord,
    role: "reviewer",
    decision: null,
    requirements: [
      { id: "1", requirement_key: "power_of_attorney", title: "Power of attorney document", status: "completed" },
      { id: "2", requirement_key: "representative_certification", title: "Representative certification", status: "completed" },
      { id: "3", requirement_key: "identity_evidence", title: "Identity evidence", status: "completed" },
    ],
  });
  assert.equal(model.statusSentence, "The bank can decide now.");
  assert.match(model.nextLine, /Reviewer/);
  assert.equal(model.primaryAction?.label, "Review and decide");
  assert.equal(model.decisionLine, "Not decided yet.");
  assert.equal(model.currencyLabel, "No decision yet.");
  assert.deepEqual(
    model.chips.map((chip) => chip.label),
    ["Who they are", "What they may ask for", "Bank's answer"],
  );
  assert.equal(model.chips[0].state, "Done");
  assert.equal(model.chips[2].state, "Not started");
  assert.equal(model.multiInstitutionLine, null);
});

test("accepted with limits shows current currency and separate chips", () => {
  const decision: HostedInstitutionDecision = {
    id: "dec-1",
    receiptCode: "R-1",
    authorityRecordId: "rec-1",
    recordVersion: 2,
    outcome: "accepted_with_limits",
    reason: "Limited to statements",
    acceptedActionKeys: ["receive_duplicate_statements"],
    limitations: ["They may get statement copies."],
    decidedBy: "user-2",
    decidedByRole: "reviewer",
    decidedAt: "2026-09-10T00:00:00.000Z",
    receiptSha256: "abc",
    receiptSnapshot: {},
  };
  const model = buildCaseOrientation({
    record: { ...baseRecord, status: "accepted_with_limits" },
    role: "admin",
    decision,
  });
  assert.equal(model.statusSentence, "The bank accepted this with limits.");
  assert.equal(model.currencyLabel, "This is the current answer.");
  assert.match(model.decisionLine, /Accepted with limits/);
  assert.equal(model.primaryAction?.label, "Open receipt");
  assert.equal(model.chips[2].state, "Done");
});

test("later revoke keeps original decision and loud later-change currency", () => {
  const decision: HostedInstitutionDecision = {
    id: "dec-1",
    receiptCode: "R-1",
    authorityRecordId: "rec-1",
    recordVersion: 2,
    outcome: "accepted",
    reason: "Looks fine",
    acceptedActionKeys: ["receive_duplicate_statements"],
    limitations: [],
    decidedBy: "user-2",
    decidedByRole: "reviewer",
    decidedAt: "2026-09-10T00:00:00.000Z",
    receiptSha256: "abc",
    receiptSnapshot: {},
  };
  const model = buildCaseOrientation({
    record: { ...baseRecord, status: "revoked" },
    role: "admin",
    decision,
    laterChangeDetail: "ended",
  });
  assert.equal(model.statusSentence, "The bank's answer changed later.");
  assert.equal(model.currencyLabel, "A later change was recorded.");
  assert.match(model.decisionLine, /Later: ended/);
  assert.equal(model.primaryAction?.label, "See what changed");
});


test("post-decision withdrawal counts as a later change", () => {
  const decision: HostedInstitutionDecision = {
    id: "dec-1",
    receiptCode: "R-1",
    authorityRecordId: "rec-1",
    recordVersion: 1,
    outcome: "accepted" as const,
    reason: "Looks fine",
    acceptedActionKeys: ["receive_duplicate_statements"],
    limitations: [],
    decidedBy: "user-2",
    decidedByRole: "reviewer",
    decidedAt: "2026-09-10T00:00:00.000Z",
    receiptSha256: "abc",
    receiptSnapshot: {},
  };
  const model = buildCaseOrientation({
    record: { ...baseRecord, status: "withdrawn" },
    role: "admin",
    decision,
  });
  assert.equal(model.statusSentence, "The bank's answer changed later.");
  assert.equal(model.currencyLabel, "A later change was recorded.");
  assert.match(model.decisionLine, /Later: the representative withdrew/);
  assert.equal(model.primaryAction?.label, "See what changed");
});

test("origin group shows multi-institution independence line", () => {
  const model = buildCaseOrientation({
    record: { ...baseRecord, originGroupId: "group-1" },
    role: "reviewer",
    decision: null,
  });
  assert.match(model.multiInstitutionLine ?? "", /one of several banks/i);
  assert.match(model.multiInstitutionLine ?? "", /only for your bank/i);
});

test("document review keeps received separate from checked", () => {
  const model = buildDocumentReviewModel({
    requirements: [
      { id: "1", requirement_key: "power_of_attorney", title: "Power of attorney document", status: "review_pending" },
      { id: "2", requirement_key: "identity_evidence", title: "Identity evidence", status: "completed" },
    ],
    artifacts: [{ id: "a1", requirement_id: "1", review_status: "pending" }],
    recordStatus: "under_review",
    hasDecision: false,
  });
  assert.ok(model);
  assert.equal(model!.checked.length, 1);
  assert.equal(model!.missing.length, 1);
  assert.match(model!.missing[0].title, /Received, not checked yet/);
  assert.equal(model!.ready, false);
});

test("draft orientation keeps send primary and offers change-emails secondary", () => {
  const model = buildCaseOrientation({
    record: { ...baseRecord, status: "draft", activatedAt: null },
    role: "staff",
    decision: null,
  });
  assert.equal(model.statusSentence, "This request is not sent yet.");
  assert.match(model.nextLine, /check emails, then send/);
  assert.equal(model.primaryAction?.href, "#review-and-send");
  assert.equal(model.primaryAction?.label, "Send request");
  assert.equal(model.secondaryAction?.href, "#contact-details");
  assert.equal(model.secondaryAction?.label, "Change emails");
});


test("empty checklist under review does not jump to missing documents anchor", () => {
  const model = buildCaseOrientation({
    record: baseRecord,
    role: "reviewer",
    decision: null,
    requirements: [],
  });
  assert.equal(model.primaryAction?.href, "#institution-decision");
  assert.equal(model.primaryAction?.label, "Review and decide");
  assert.equal(model.chips[1].label, "What they may ask for");
  assert.equal(model.chips[1].state, "Not started");
});

test("empty checklist without asked-for actions uses locked empty copy", () => {
  const model = buildCaseOrientation({
    record: { ...baseRecord, allowedActionKeys: [] },
    role: "reviewer",
    decision: null,
    requirements: [],
  });
  assert.equal(model.primaryAction?.href, "#what-they-may-ask-for");
  assert.equal(model.primaryAction?.label, "Pick at least one thing to ask for.");
  assert.match(model.nextLine, /Pick at least one thing to ask for\./);
  assert.equal(model.chips[1].state, "Needed");
});

test("participant bank-only link line uses locked multi-inst wording", () => {
  assert.equal(participantBankOnlyLinkLine("Sample Bank"), "This link is only for Sample Bank.");
  assert.equal(participantBankOnlyLinkLine("  "), null);
  assert.equal(participantBankOnlyLinkLine(null), null);
});

test("received evidence directs the bank while preserving representative work", () => {
  const requirements = [
    { id: "1", requirement_key: "power_of_attorney", title: "POA", status: "review_pending" },
    { id: "2", requirement_key: "representative_certification", title: "Certification", status: "completed" },
  ];
  const artifacts = [{ id: "a", requirement_id: "1", review_status: "pending" }];
  const input = { record: { ...baseRecord, status: "evidence_required" as const }, role: "owner" as const, decision: null, requirements, artifacts };
  const model = buildCaseOrientation(input);
  assert.equal(model.primaryAction?.href, "#required-information");
  assert.match(model.nextLine, /Bank reviewer/);
  const documents = buildDocumentReviewModel({ requirements, artifacts, recordStatus: "evidence_required", hasDecision: false });
  assert.equal(documents?.checked[0].whoMustFix, "Confirmed by the representative");
  const unfinished = buildCaseOrientation({ ...input, requirements: requirements.map(item => item.id === "2" ? { ...item, status: "pending" } : item) });
  assert.match(unfinished.nextLine, /Riley Rep/);
});
