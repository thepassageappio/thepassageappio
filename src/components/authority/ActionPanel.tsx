import { randomUUID } from "node:crypto";
import { executeAuthorityAction } from "@/app/actions";
import type { AuthorityRecord, Party } from "@/lib/authority/types";
import styles from "./authority.module.css";
import extra from "./action-extra.module.css";

function Hidden({ record, command }: { record: AuthorityRecord; command: string }) {
  return (
    <>
      <input type="hidden" name="recordId" value={record.id} />
      <input type="hidden" name="expectedVersion" value={record.version} />
      <input type="hidden" name="idempotencyKey" value={`ui_${randomUUID()}`} />
      <input type="hidden" name="command" value={command} />
    </>
  );
}

function Waiting({ title, body }: { title: string; body: string }) {
  return (
    <section className={styles.actionPanel}>
      <p className={styles.eyebrow}>Next step</p>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className={styles.waitingLine}>
        <span aria-hidden="true" /> Passage will update this view when the step is saved.
      </div>
    </section>
  );
}

function Principal({ record }: { record: AuthorityRecord }) {
  if (record.status === "awaiting_principal") {
    return (
      <section className={styles.actionPanel}>
        <p className={styles.eyebrow}>Your next step</p>
        <h2>Confirm the request details</h2>
        <p>
          This authorization applies only to {record.accountBoundary}. {record.relyingParty.name} still decides what it accepts.
        </p>
        <dl className={extra.reviewSummary}>
          <div><dt>Source</dt><dd>{record.authoritySource.instrumentName}</dd></div>
          <div><dt>Allowed</dt><dd>{record.allowedActions.map((action) => action.label).join("; ")}</dd></div>
          <div><dt>Never included</dt><dd>{record.prohibitedActions.map((action) => action.label).join("; ")}</dd></div>
          <div><dt>Ends</dt><dd>{new Date(record.validUntil).toLocaleDateString("en-US", { dateStyle: "long" })}</dd></div>
        </dl>
        <form action={executeAuthorityAction} className={styles.formStack}>
          <Hidden record={record} command="confirm_grant" />
          <label className={styles.checkRow}>
            <input type="checkbox" name="acknowledged" required />
            <span>I understand the exact allowed and prohibited actions, and that I can revoke this authority.</span>
          </label>
          <button className={styles.primaryButton} type="submit">Confirm and continue to {record.representative.name}</button>
          <small>Your confirmation, scope, policy, time, and next responsible person will be saved to the shared receipt.</small>
        </form>
      </section>
    );
  }

  if ([
    "awaiting_representative",
    "evidence_required",
    "ready_to_submit",
    "under_review",
    "information_requested",
    "accepted",
    "accepted_with_limits",
  ].includes(record.status)) {
    return (
      <section className={`${styles.actionPanel} ${styles.dangerPanel}`}>
        <p className={styles.eyebrow}>You remain in control</p>
        <h2>Revoke this authority</h2>
        <p>Revocation stops future presentation in Passage and creates an immediate webhook for the institution. It does not undo completed actions.</p>
        <details className={styles.reviewOption}>
          <summary>Review revocation consequences</summary>
          <form action={executeAuthorityAction} className={styles.formStack}>
            <Hidden record={record} command="revoke_authority" />
            <label>Reason<textarea name="reason" required minLength={3} placeholder="Why is this authority ending?" /></label>
            <label className={styles.checkRow}>
              <input type="checkbox" name="acknowledged" required />
              <span>I understand this ends future use and creates a revocation receipt visible to the institution.</span>
            </label>
            <button className={styles.secondaryButton} type="submit">Revoke authority</button>
          </form>
        </details>
      </section>
    );
  }

  return <Waiting title="No action is required" body="The final outcome and authority lifecycle are preserved in the receipt." />;
}

function RepresentativeRequirementList({ record }: { record: AuthorityRecord }) {
  const requirements = record.requirements.filter((requirement) => requirement.owner === "representative");
  const actionLabel: Record<string, string> = {
    power_of_attorney_document: "Use illustrative POA",
    agent_certification: "Sign certification",
    representative_identity: "Complete identity check",
    current_address: "Confirm address",
  };
  return (
    <div className={styles.evidenceList}>
      {requirements.map((requirement) => (
        <div className={styles.evidenceItem} key={requirement.key}>
          <div>
            <strong>{requirement.label}</strong>
            <p>{requirement.description}</p>
            <small>{requirement.reason}</small>
          </div>
          {requirement.status === "complete" ? (
            <span className={styles.completePill}>Complete</span>
          ) : requirement.key === "representative_acceptance" ? (
            <span className={styles.completePill}>Accepted earlier</span>
          ) : (
            <form action={executeAuthorityAction}>
              <Hidden record={record} command="complete_requirement" />
              <input type="hidden" name="requirementKey" value={requirement.key} />
              <button className={styles.compactButton} type="submit">{actionLabel[requirement.key] ?? "Complete step"}</button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

function Representative({ record }: { record: AuthorityRecord }) {
  if (record.status === "awaiting_representative") {
    return (
      <section className={styles.actionPanel}>
        <p className={styles.eyebrow}>Your next step</p>
        <h2>Accept or decline the responsibility</h2>
        <p>You are not receiving ownership or unrestricted access. This role is limited to the actions shown below and can be declined.</p>
        <form action={executeAuthorityAction} className={styles.formStack}>
          <Hidden record={record} command="accept_responsibility" />
          <label className={styles.checkRow}>
            <input type="checkbox" name="acknowledged" required />
            <span>I understand the duties, allowed actions, prohibitions, and responsibility to act only for {record.principal.name}.</span>
          </label>
          <button className={styles.primaryButton} type="submit">Accept responsibility</button>
        </form>
        <details className={styles.reviewOption}>
          <summary>I cannot take this responsibility</summary>
          <form action={executeAuthorityAction} className={styles.formStack}>
            <Hidden record={record} command="decline_responsibility" />
            <label>Reason<textarea name="reason" required minLength={3} placeholder="Explain why you are declining." /></label>
            <label className={styles.checkRow}>
              <input type="checkbox" name="acknowledged" required />
              <span>I understand declining ends this request and notifies {record.principal.name} and the institution.</span>
            </label>
            <button className={styles.secondaryButton} type="submit">Decline request</button>
          </form>
        </details>
      </section>
    );
  }

  if (record.status === "evidence_required") {
    const complete = record.requirements.filter((requirement) => requirement.required && requirement.status === "complete").length;
    return (
      <section className={styles.actionPanel}>
        <p className={styles.eyebrow}>Your next step</p>
        <h2>Complete the policy requirements</h2>
        <p>{complete} of {record.requirements.filter((requirement) => requirement.required).length} required items are complete. Each result records its method, source, and disclosed fields.</p>
        <RepresentativeRequirementList record={record} />
      </section>
    );
  }

  if (record.status === "ready_to_submit") {
    const fieldLabel: Record<string, string> = {
      identity_match: "Identity match result",
      acceptance_attestation: "Representative acceptance",
      principal_name: "Name of person granting authority",
      representative_name: "Representative name",
      effective_terms: "Effective terms",
      powers: "Relevant powers",
      execution_pages: "Execution page findings",
      agent_attestation: "Representative certification",
      instrument_currentness_attestation: "Statement that the POA remains current",
      address_match: "Address match result",
      document_recency: "Address document date",
    };
    const disclosedFields = [...new Set(record.evidenceArtifacts.flatMap((artifact) => artifact.disclosedFields))]
      .map((field) => fieldLabel[field] ?? field.replaceAll("_", " "));
    return (
      <section className={styles.actionPanel}>
        <p className={styles.eyebrow}>Check before sending</p>
        <h2>Send the minimum-necessary packet</h2>
        <p>The reviewer receives requirement results, source references, and the disclosure receipt. Unrelated personal information and raw identity documents stay outside this packet.</p>
        <dl className={extra.reviewSummary}>
          <div><dt>Purpose</dt><dd>{record.purpose}</dd></div>
          <div><dt>Recipient</dt><dd>{record.relyingParty.name}</dd></div>
          <div><dt>Policy</dt><dd>{record.policy.label} {record.policy.version} · {record.policy.jurisdiction}</dd></div>
          <div><dt>Evidence results</dt><dd>{record.evidenceArtifacts.length} sourced artifacts</dd></div>
          <div><dt>Fields disclosed</dt><dd>{disclosedFields.join(", ")}</dd></div>
          <div><dt>Raw identity document</dt><dd>Not disclosed in the sandbox</dd></div>
        </dl>
        <form action={executeAuthorityAction} className={styles.formStack}>
          <Hidden record={record} command="submit_record" />
          <label className={styles.checkRow}>
            <input type="checkbox" name="consented" required />
            <span>I consent to share only the listed sandbox results with {record.relyingParty.name} for this request.</span>
          </label>
          <button className={styles.primaryButton} type="submit">Submit for institutional review</button>
        </form>
      </section>
    );
  }

  if (record.status === "information_requested" && record.informationRequest) {
    const requirement = record.requirements.find((entry) => entry.key === record.informationRequest?.requirementKey);
    return (
      <section className={styles.actionPanel}>
        <p className={styles.eyebrow}>Reviewer request · {requirement?.label ?? "Requirement"}</p>
        <h2>{record.informationRequest.message}</h2>
        <p>The response is attached to this requirement and returned to the same reviewer workspace.</p>
        <form action={executeAuthorityAction} className={styles.formStack}>
          <Hidden record={record} command="resolve_information" />
          <label>Your response<textarea name="response" required minLength={3} placeholder="Explain what you confirmed or added." /></label>
          <button className={styles.primaryButton} type="submit">Send response</button>
        </form>
      </section>
    );
  }

  if (["evidence_required", "ready_to_submit", "under_review", "information_requested", "accepted", "accepted_with_limits"].includes(record.status)) {
    return (
      <section className={styles.actionPanel}>
        <p className={styles.eyebrow}>Your responsibility</p>
        <h2>{record.status === "under_review" ? "The institution is reviewing this request" : "No action is required right now"}</h2>
        <p>The current owner and saved progress are visible above. You may withdraw if you can no longer serve.</p>
        <details className={styles.reviewOption}>
          <summary>Withdraw from this responsibility</summary>
          <form action={executeAuthorityAction} className={styles.formStack}>
            <Hidden record={record} command="withdraw_responsibility" />
            <label>Reason<textarea name="reason" required minLength={3} placeholder="Why can you no longer serve?" /></label>
            <label className={styles.checkRow}>
              <input type="checkbox" name="acknowledged" required />
              <span>I understand withdrawal ends future use and notifies the person who granted authority and the institution.</span>
            </label>
            <button className={styles.secondaryButton} type="submit">Withdraw</button>
          </form>
        </details>
      </section>
    );
  }

  return <Waiting title="No action is required" body="The current outcome is preserved in the receipt." />;
}

function Reviewer({ record }: { record: AuthorityRecord }) {
  if (record.status !== "under_review") {
    if (["accepted", "accepted_with_limits", "rejected"].includes(record.status)) {
      return (
        <section className={styles.actionPanel}>
          <p className={styles.eyebrow}>Decision recorded</p>
          <h2>{record.status === "accepted_with_limits" ? "Accepted with limits" : record.status === "accepted" ? "Accepted" : "Not accepted"}</h2>
          <p>The institution&apos;s outcome, accepted actions, limits, evidence references, and lifecycle are preserved in the decision receipt.</p>
        </section>
      );
    }
    if (["declined", "withdrawn", "revoked", "expired"].includes(record.status)) {
      return <Waiting title="This request has ended" body="The reason and final lifecycle state are preserved in the decision receipt." />;
    }
    return (
      <Waiting
        title={record.status === "information_requested" ? `Waiting for ${record.representative.name}` : "The packet is not ready for review"}
        body="The responsible participant and saved progress are shown in the status, policy requirements, and receipt."
      />
    );
  }

  return (
    <section className={styles.actionPanel}>
      <p className={styles.eyebrow}>Your next step · Policy {record.policy.version}</p>
      <h2>Review and record the institution&apos;s decision</h2>
      <p>Passage shows policy completion and source details separately. Your institution retains the final decision.</p>
      <div className={styles.reviewerEvidence}>
        {record.requirements.map((requirement) => (
          <span key={requirement.key}>
            <b aria-hidden="true">{requirement.status === "complete" ? "✓" : "!"}</b> {requirement.label} · {requirement.status === "complete" ? "Complete" : "Needs attention"}
          </span>
        ))}
      </div>
      <details className={styles.reviewOption}>
        <summary>Request more information</summary>
        <form action={executeAuthorityAction} className={styles.formStack}>
          <Hidden record={record} command="request_information" />
          <label>Policy requirement<select name="requirementKey" defaultValue="current_address">{record.requirements.map((requirement) => <option key={requirement.key} value={requirement.key}>{requirement.label}</option>)}</select></label>
          <label>What is still needed?<textarea name="message" required minLength={3} defaultValue="Provide an address document dated within the last 90 days." /></label>
          <button className={styles.secondaryButton} type="submit">Send request to {record.representative.name}</button>
        </form>
      </details>
      <details className={styles.reviewOption} open>
        <summary>Record a decision</summary>
        <form action={executeAuthorityAction} className={styles.formStack}>
          <Hidden record={record} command="record_decision" />
          <label>Outcome<select name="outcome" defaultValue="accepted_with_limits"><option value="accepted_with_limits">Accept with limits</option><option value="accepted">Accept as submitted</option><option value="rejected">Do not accept</option></select></label>
          <label>Decision reason<textarea name="reason" required minLength={3} defaultValue="All policy requirements are complete. Source references and items needing human confirmation are visible." /></label>
          <label>Limits, one per line<textarea name="limitations" defaultValue={"Duplicate statements and service discussion only\nNo funds movement\nExpires September 1, 2027"} /></label>
          <label className={styles.checkRow}>
            <input type="checkbox" name="acknowledged" required />
              <span>I confirm this is the institution&apos;s sandbox decision under policy {record.policy.version}. It will become part of the shared receipt.</span>
          </label>
          <button className={styles.primaryButton} type="submit">Record institutional decision</button>
        </form>
      </details>
    </section>
  );
}

export function ActionPanel({ record, actor }: { record: AuthorityRecord; actor: Party }) {
  if (actor.role === "principal") return <Principal record={record} />;
  if (actor.role === "representative") return <Representative record={record} />;
  return <Reviewer record={record} />;
}
