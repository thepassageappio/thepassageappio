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
