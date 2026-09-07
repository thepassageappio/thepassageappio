import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the public journey offers a guided demo without hiding product evaluation", () => {
  const home = source("../../app/page.tsx");
  const header = source("../../components/commercial/CommercialHeader.tsx");

  assert.match(home, /Book a 20-minute walkthrough/);
  assert.match(home, /Explore a sample workflow/);
  assert.match(header, /href="\/start\?intent=sign-in">Sign in/);
  assert.match(header, /href="\/contact">Book a demo/);
  assert.doesNotMatch(home, /Current status shared by permission|Complete activity history/);
});

test("the public story explains the real-life use case, identity boundary, and completed result plainly", () => {
  const home = source("../../app/page.tsx");
  const about = source("../../app/about/page.tsx");
  const security = source("../../app/security/page.tsx");
  const faq = source("../../app/faq/page.tsx");

  assert.match(home, /If you help a parent or grandparent manage money/);
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
  const polish = source("../../components/app/workspace-polish.module.css");

  assert.match(shell, /className=\{polish\.navigation\}/);
  assert.match(app, /data-label="People"/);
  assert.match(app, /data-label="Action"/);
  assert.match(polish, /grid-auto-flow: column/);
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
