import { applyAuthorityCommand } from "./domain.ts";
import type {
  AuthorityCommand,
  AuthorityEvent,
  AuthorityRecord,
  AuthorityRequestInput,
  OrganizationRef,
  PolicyVersionSnapshot,
  SandboxScenario,
} from "./types.ts";

export const SANDBOX_RECORD_ID = "ar_sandbox_carter";

export const SANDBOX_ORGANIZATION: OrganizationRef = {
  id: "org_hvcu_sandbox",
  name: "Hudson Valley Community Credit Union",
  slug: "hvcu-sandbox",
};

export const SANDBOX_POLICY: PolicyVersionSnapshot = {
  id: "policy_hvcu_financial_poa_v1_3",
  label: "Financial POA acceptance",
  version: "1.3",
  jurisdiction: "US-NY",
  effectiveAt: "2026-08-23T00:00:00.000Z",
  status: "sandbox",
  requirements: [
    {
      key: "principal_identity",
      label: "Identity of person granting authority",
      description: "Confirm that the person granting authority matches the invited customer.",
      reason: "The institution must bind the grant to the account holder.",
      owner: "principal",
      required: true,
      acceptedMethods: ["synthetic_identity_session"],
    },
    {
      key: "representative_acceptance",
      label: "Representative acceptance",
      description: "Record that the representative understands and accepts the duties and limits.",
      reason: "The role is never accepted merely by opening an invitation.",
      owner: "representative",
      required: true,
      acceptedMethods: ["signed_attestation"],
    },
    {
      key: "power_of_attorney_document",
      label: "Power of attorney document",
      description: "Provide the complete power of attorney so the institution can review the named people, effective terms, powers, limits, and execution pages.",
      reason: "The institution must review the authority instrument and compare its terms with the requested account actions.",
      owner: "representative",
      required: true,
      acceptedMethods: ["illustrative_document_review"],
    },
    {
      key: "agent_certification",
      label: "Representative certification",
      description: "Confirm that the power of attorney remains in effect and that you are acting within its terms.",
      reason: "New York law permits a financial institution to request an agent certification in appropriate circumstances.",
      owner: "representative",
      required: true,
      acceptedMethods: ["signed_agent_certification"],
    },
    {
      key: "representative_identity",
      label: "Representative identity",
      description: "Confirm that the invited representative matches the person completing the request.",
      reason: "The institution must know who will present the accepted authority.",
      owner: "representative",
      required: true,
      acceptedMethods: ["synthetic_identity_check"],
    },
    {
      key: "current_address",
      label: "Current address",
      description: "Confirm a current address using a document dated within the last 90 days.",
      reason: "Required by the sample institution policy for limited service access.",
      owner: "representative",
      required: true,
      acceptedMethods: ["synthetic_document_check", "reviewer_attestation"],
    },
  ],
};

type TestCommand = AuthorityCommand extends infer Command
  ? Command extends AuthorityCommand
    ? Omit<Command, "expectedVersion" | "idempotencyKey">
    : never
  : never;

type FixtureBundle = { record: AuthorityRecord; events: AuthorityEvent[] };

function atMinute(base: string, minute: number) {
  return new Date(new Date(base).getTime() + minute * 60_000).toISOString();
}

function initialsId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function baseRecord(options: {
  id: string;
  principalName: string;
  representativeName: string;
  scenario: SandboxScenario;
  now: string;
}): FixtureBundle {
  const key = options.id.replace(/^ar_/, "");
  const record: AuthorityRecord = {
    id: options.id,
    version: 1,
    status: "awaiting_principal",
    purpose: "Allow a trusted representative to receive duplicate statements and discuss account-service issues while the principal remains in control.",
    accountBoundary: "Membership account ending 4821",
    principal: {
      id: `party_${key}_principal`,
      name: options.principalName,
      email: `${initialsId(options.principalName)}@example.test`,
      role: "principal",
    },
    representative: {
      id: `party_${key}_representative`,
      name: options.representativeName,
      email: `${initialsId(options.representativeName)}@example.test`,
      role: "representative",
    },
    reviewer: {
      id: `party_${key}_reviewer`,
      name: "Jordan Lee",
      email: "jordan@hvcu.example.test",
      role: "reviewer",
      organization: SANDBOX_ORGANIZATION.name,
    },
    relyingParty: structuredClone(SANDBOX_ORGANIZATION),
    authoritySource: {
      id: `source_${key}`,
      type: "financial_power_of_attorney",
      label: "Financial power of attorney",
      instrumentName: "Illustrative New York Power of Attorney",
      instrumentVersion: "sample-1.0",
      jurisdiction: SANDBOX_POLICY.jurisdiction,
      executionMode: "external_instrument",
      status: "proposed",
    },
    policy: structuredClone(SANDBOX_POLICY),
    validUntil: "2027-09-01T23:59:59.000Z",
    allowedActions: [
      {
        key: "receive_duplicate_statements",
        label: "Receive duplicate monthly statements",
        description: "Receive copies of statements for the named account boundary.",
        riskTier: 1,
        category: "disclosure",
      },
      {
        key: "discuss_service_issues",
        label: "Discuss account-service issues",
        description: "Speak with service staff about the status of non-transactional requests.",
        riskTier: 1,
        category: "contact",
      },
    ],
    prohibitedActions: [
      {
        key: "move_money",
        label: "Move or withdraw money",
        description: "No transfers, withdrawals, checks, wires, cards, or cash access.",
        riskTier: 3,
        category: "transaction",
      },
      {
        key: "change_contact_details",
        label: "Change contact details",
        description: "The representative may discuss service but cannot change the customer's address, phone, or email.",
        riskTier: 2,
        category: "service",
      },
      {
        key: "close_accounts",
        label: "Close accounts or change ownership",
        description: "No closure, addition of owners, or removal of owners.",
        riskTier: 4,
        category: "ownership",
      },
      {
        key: "change_beneficiaries",
        label: "Change beneficiaries or investments",
        description: "No payable-on-death, beneficiary, trading, or investment-instruction changes.",
        riskTier: 4,
        category: "ownership",
      },
    ],
    requirements: SANDBOX_POLICY.requirements.map((requirement) => ({
      ...structuredClone(requirement),
      status: "needed",
      evidenceArtifactIds: [],
    })),
    evidenceArtifacts: [],
    consentSnapshots: [],
    disclosures: [],
    sandboxScenario: options.scenario,
    createdAt: options.now,
    updatedAt: options.now,
  };

  return {
    record,
    events: [
      {
        id: `evt_${key}_created`,
        authorityRecordId: record.id,
        sequence: 1,
        type: "authority_record.created",
        actorId: "system",
        actorRole: "system",
        summary: "Authority request opened",
        detail: `${record.relyingParty.name} prepared a limited service request for ${record.principal.name} and ${record.representative.name}.`,
        audience: ["principal", "representative", "reviewer"],
        nextOwner: "principal",
        createdAt: options.now,
        recordVersion: 1,
      },
    ],
  };
}

function applySeedCommand(bundle: FixtureBundle, command: TestCommand, baseTime: string) {
  const nextSequence = bundle.events.length + 1;
  const result = applyAuthorityCommand(
    bundle.record,
    {
      ...command,
      expectedVersion: bundle.record.version,
      idempotencyKey: `seed_${bundle.record.id}_${nextSequence}_${command.type}`,
    } as AuthorityCommand,
    {
      now: atMinute(baseTime, nextSequence),
      eventId: `evt_${bundle.record.id.replace(/^ar_/, "")}_${nextSequence}`,
      sequence: nextSequence,
    },
  );
  bundle.record = result.record;
  bundle.events.push(result.event);
}

function advanceToReview(bundle: FixtureBundle, baseTime: string) {
  const principal = { actorId: bundle.record.principal.id, actorRole: "principal" as const };
  const representative = { actorId: bundle.record.representative.id, actorRole: "representative" as const };
  applySeedCommand(bundle, { type: "confirm_grant", ...principal, acknowledged: true }, baseTime);
  applySeedCommand(bundle, { type: "accept_responsibility", ...representative, acknowledged: true }, baseTime);
  applySeedCommand(bundle, { type: "complete_requirement", ...representative, requirementKey: "power_of_attorney_document" }, baseTime);
  applySeedCommand(bundle, { type: "complete_requirement", ...representative, requirementKey: "agent_certification" }, baseTime);
  applySeedCommand(bundle, { type: "complete_requirement", ...representative, requirementKey: "representative_identity" }, baseTime);
  applySeedCommand(bundle, { type: "complete_requirement", ...representative, requirementKey: "current_address" }, baseTime);
  applySeedCommand(bundle, { type: "submit_record", ...representative, consented: true }, baseTime);
}

export function createScenarioFixture(
  id: string,
  scenario: SandboxScenario,
  now = new Date().toISOString(),
): FixtureBundle {
  const label = scenario.replaceAll("_", " ");
  return baseRecord({
    id,
    principalName: `${label[0].toUpperCase()}${label.slice(1)} Principal`,
    representativeName: `${label[0].toUpperCase()}${label.slice(1)} Representative`,
    scenario,
    now,
  });
}

export function createRequestFixture(
  id: string,
  input: AuthorityRequestInput,
  now = new Date().toISOString(),
): FixtureBundle {
  const bundle = baseRecord({
    id,
    principalName: input.principalName,
    representativeName: input.representativeName,
    scenario: "standard",
    now,
  });
  bundle.record.principal.email = input.principalEmail;
  bundle.record.representative.email = input.representativeEmail;
  bundle.record.accountBoundary = input.accountBoundary;
  bundle.record.validUntil = input.validUntil;
  bundle.record.allowedActions = bundle.record.allowedActions.filter((action) =>
    input.allowedActionKeys.includes(action.key),
  );
  bundle.record.purpose = `Allow ${input.representativeName} to help ${input.principalName} with the selected account-service actions while the institution retains the final acceptance decision.`;
  bundle.events[0] = {
    ...bundle.events[0],
    detail: `${bundle.record.relyingParty.name} opened a financial power of attorney request for ${input.principalName} and ${input.representativeName}.`,
  };
  return bundle;
}

export function createSandboxFixture(now = "2026-08-23T16:00:00.000Z"): {
  record: AuthorityRecord;
  event: AuthorityEvent;
} {
  const bundle = baseRecord({
    id: SANDBOX_RECORD_ID,
    principalName: "Eleanor Carter",
    representativeName: "Maya Carter",
    scenario: "rfi_then_limited",
    now,
  });
  return { record: bundle.record, event: bundle.events[0] };
}

export function createSandboxSeed(now = "2026-08-23T16:00:00.000Z"): FixtureBundle[] {
  const carter = baseRecord({
    id: SANDBOX_RECORD_ID,
    principalName: "Eleanor Carter",
    representativeName: "Maya Carter",
    scenario: "rfi_then_limited",
    now,
  });

  const reyes = baseRecord({
    id: "ar_sandbox_reyes",
    principalName: "Lucia Reyes",
    representativeName: "Mateo Reyes",
    scenario: "standard",
    now: atMinute(now, -90),
  });
  advanceToReview(reyes, atMinute(now, -90));

  const khan = baseRecord({
    id: "ar_sandbox_khan",
    principalName: "Samira Khan",
    representativeName: "Amina Khan",
    scenario: "standard",
    now: atMinute(now, -180),
  });
  advanceToReview(khan, atMinute(now, -180));
  applySeedCommand(
    khan,
    {
      type: "request_information",
      actorId: khan.record.reviewer.id,
      actorRole: "reviewer",
      requirementKey: "current_address",
      message: "Provide an address document dated within the last 90 days.",
    },
    atMinute(now, -180),
  );

  const wilson = baseRecord({
    id: "ar_sandbox_wilson",
    principalName: "James Wilson",
    representativeName: "Taylor Wilson",
    scenario: "representative_declines",
    now: atMinute(now, -240),
  });
  applySeedCommand(
    wilson,
    { type: "confirm_grant", actorId: wilson.record.principal.id, actorRole: "principal", acknowledged: true },
    atMinute(now, -240),
  );
  applySeedCommand(
    wilson,
    {
      type: "decline_responsibility",
      actorId: wilson.record.representative.id,
      actorRole: "representative",
      reason: "I am not able to take on this responsibility.",
      acknowledged: true,
    },
    atMinute(now, -240),
  );

  const brooks = baseRecord({
    id: "ar_sandbox_brooks",
    principalName: "Ruth Brooks",
    representativeName: "Devin Brooks",
    scenario: "webhook_retry",
    now: atMinute(now, -320),
  });
  advanceToReview(brooks, atMinute(now, -320));
  applySeedCommand(
    brooks,
    {
      type: "record_decision",
      actorId: brooks.record.reviewer.id,
      actorRole: "reviewer",
      outcome: "accepted_with_limits",
      reason: "The synthetic policy requirements are satisfied.",
      limitations: ["Duplicate statements and service discussion only", "No funds movement"],
      acknowledged: true,
    },
    atMinute(now, -320),
  );

  return [carter, reyes, khan, wilson, brooks];
}
