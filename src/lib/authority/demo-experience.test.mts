import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the public journey offers a guided demo without hiding product evaluation", () => {
  const home = source("../../app/page.tsx");
  const header = source("../../components/commercial/CommercialHeader.tsx");

  assert.match(home, /Book a 20-minute walkthrough/);
  assert.match(home, /Try an example/);
  assert.match(header, /href="\/start\?intent=sign-in">Sign in/);
  assert.match(header, /href="\/contact">Book a demo/);
  assert.doesNotMatch(home, /Current status shared by permission|Complete activity history/);
});

test("sample access uses an explicit, durable lead gate", () => {
  const sample = source("../../app/sample/page.tsx");
  const access = source("../../app/sample/access/page.tsx");
  const action = source("../../app/sample/actions.ts");
  const hubspot = source("../commercial/hubspot-inquiry.ts");
  const privacy = source("../../app/legal/privacy/page.tsx");

  assert.match(sample, /hasSampleAccessLead/);
  assert.match(sample, /redirect\("\/sample\/access"\)/);
  assert.match(access, /Passage may email me a short sample follow-up series/);
  assert.match(access, /Agree and view sample/);
  assert.match(action, /createSampleAccessLead/);
  assert.match(hubspot, /projectSampleAccessLead/);
  assert.match(hubspot, /pa_lead_source: payload\.acquisition_source_label/);
  assert.match(hubspot, /pa_acquisition_source: payload\.acquisition_source/);
  assert.match(hubspot, /pa_nurture_program: payload\.nurture_program/);
  assert.match(hubspot, /pa_nurture_status: payload\.nurture_status/);
  assert.match(privacy, /Version evaluation-2026\.2/);
  assert.match(privacy, /Send sample follow-up, product updates, or a walkthrough invitation/);
  assert.match(hubspot, /upsertContactByEmail\(token, payload\.email/);
  assert.match(hubspot, /findByUniqueProperty\(token, "contacts", "email", email\)/);
  assert.match(hubspot, /updateProperties/);
});

test("the public story explains the real-life use case, identity boundary, and completed result plainly", () => {
  const home = source("../../app/page.tsx");
  const about = source("../../app/about/page.tsx");
  const security = source("../../app/security/page.tsx");
  const faq = source("../../app/faq/page.tsx");

  assert.match(home, /Helping a parent or grandparent with their bank account/);
  assert.match(home, /Accepted with limits/);
  assert.match(home, /Decision receipt shared/);
  assert.match(about, /Maya helps her grandmother Eleanor/);
  assert.match(about, /The institution starts the Passage request today/);
  assert.match(security, /A private link protects access\. It does not prove identity/);
  assert.match(faq, /Is this for me if I am my grandmother/);
  assert.match(faq, /What does a completed request look like/);
});

test("an unavailable participant link explains replacement and recovery", () => {
  const invitation = source("../../app/r/[token]/page.tsx");
  const delivery = source("participant-invitation-delivery.ts");

  assert.match(invitation, /Open the newest Passage email/);
  assert.match(invitation, /ask the financial institution to send a fresh link/);
  assert.match(delivery, /every earlier link stops working/);
});

test("mobile institution navigation and request rows do not require a desktop-width canvas", () => {
  const app = source("../../app/app/page.tsx");
  const shell = source("../../components/app/AppShell.tsx");
  const shellStyles = source("../../components/app/app-shell.module.css");
  const polish = source("../../components/app/workspace-polish.module.css");

  assert.match(shell, /className=\{polish\.navigation\}/);
  assert.match(app, /data-label="People"/);
  assert.match(app, /data-label="Action"/);
  assert.match(polish, /grid-auto-flow: column/);
  assert.match(shellStyles, /\.sidebar nav\{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:max-content/);
  assert.doesNotMatch(shellStyles, /\.sidebar nav\{[^}]*grid-template-columns:repeat\(/);
  assert.match(polish, /\.table tbody,[\s\S]+display: block/);
  assert.doesNotMatch(polish, /min-width:\s*720px/);
});

test("reviewers and participants receive a visible next action before supporting detail", () => {
  const institutionRequest = source("../../app/app/requests/[id]/page.tsx");
  const participantOverview = source("../../app/request/[id]/overview/page.tsx");
  const participantRequirements = source("../../app/request/[id]/requirements/page.tsx");

  assert.match(institutionRequest, /Your next step:/);
  assert.match(institutionRequest, /href: "#institution-decision"/);
  assert.match(institutionRequest, /href: "#required-information"/);
  assert.match(participantOverview, /Your next step: review and decide/);
  assert.match(participantOverview, /Nothing changes until you choose an action/);
  assert.match(participantRequirements, /allComplete \? "Review and send"/);
});
