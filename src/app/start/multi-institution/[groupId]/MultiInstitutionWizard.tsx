"use client";

import { useState, useTransition } from "react";
import {
  addSubmissionTargetAction,
  removeSubmissionTargetAction,
  searchInstitutionsAction,
  submitSubmissionGroupAction,
  updateSubmissionGroupDetailsAction,
  uploadSubmissionEvidenceAction,
} from "@/app/multi-institution-actions";
import styles from "@/components/account/account.module.css";
import {
  MAX_SUBMISSION_TARGETS,
  MIN_SUBMISSION_TARGETS,
  MULTI_INSTITUTION_CASE_INDEPENDENCE_NOTICE,
  PASSAGE_AUTHORITY_BOUNDARY_NOTICE,
  SUBMISSION_EVIDENCE_LABELS,
  type InstitutionSearchResult,
  type RequesterSessionContext,
} from "@/lib/authority/multi-institution-submission";
import wizardStyles from "../multi-institution.module.css";

const STEPS = ["Who the request is about", "Which banks", "Shared files", "Check before send"] as const;

type EvidenceRequirementKey = "power_of_attorney" | "identity_evidence";

export function MultiInstitutionWizard({ initialContext }: { initialContext: RequesterSessionContext }) {
  const [context, setContext] = useState(initialContext);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [details, setDetails] = useState({
    principalName: initialContext.principalName ?? "",
    principalEmail: initialContext.principalEmailNormalized ?? "",
    representativeName: initialContext.representativeName ?? "",
    representativeEmail: initialContext.representativeEmailNormalized ?? "",
    principalConfirmationAvailable: initialContext.principalConfirmationAvailable,
    principalConfirmationUnavailableReason: initialContext.principalConfirmationUnavailableReason ?? "",
  });

  const [targetLabel, setTargetLabel] = useState("");
  const [targetType, setTargetType] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InstitutionSearchResult[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<InstitutionSearchResult | null>(null);
  const [unmatchedMode, setUnmatchedMode] = useState(false);

  const [attested, setAttested] = useState(false);

  const targetsComplete = context.targets.length >= MIN_SUBMISSION_TARGETS && context.targets.length <= MAX_SUBMISSION_TARGETS;
  const evidenceKeys = new Set(context.evidence.map((item) => item.requirementKey));
  const evidenceComplete = evidenceKeys.has("power_of_attorney") && evidenceKeys.has("identity_evidence");

  function goTo(nextStep: number) {
    setError(null);
    setStep(nextStep);
  }

  function saveDetails() {
    setError(null);
    startTransition(async () => {
      const result = await updateSubmissionGroupDetailsAction({
        groupId: context.groupId,
        expectedVersion: context.version,
        principalName: details.principalName,
        principalEmail: details.principalEmail,
        representativeName: details.representativeName,
        representativeEmail: details.representativeEmail,
        principalConfirmationAvailable: details.principalConfirmationAvailable,
        principalConfirmationUnavailableReason: details.principalConfirmationUnavailableReason,
      });
      if (result.error || !result.context) { setError(result.error); return; }
      setContext(result.context);
      goTo(1);
    });
  }

  function runSearch(query: string) {
    setTargetQuery(query);
    setSelectedOrganization(null);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    startTransition(async () => {
      const result = await searchInstitutionsAction(query);
      setSearchResults(result.results);
    });
  }

  function addTarget() {
    setError(null);
    const label = unmatchedMode ? targetLabel : selectedOrganization?.displayName ?? "";
    const institutionType = unmatchedMode ? targetType : selectedOrganization?.organizationType ?? "";
    const organizationId = unmatchedMode ? null : selectedOrganization?.organizationId ?? null;
    if (!label || !institutionType) { setError("Enter the bank's name and type, or pick a search result."); return; }
    startTransition(async () => {
      const result = await addSubmissionTargetAction({ groupId: context.groupId, expectedVersion: context.version, label, institutionType, organizationId });
      if (result.error || !result.context) { setError(result.error); return; }
      setContext(result.context);
      setTargetLabel(""); setTargetType(""); setTargetQuery(""); setSearchResults([]); setSelectedOrganization(null); setUnmatchedMode(false);
    });
  }

  function removeTarget(targetId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeSubmissionTargetAction({ groupId: context.groupId, expectedVersion: context.version, targetId });
      if (result.error || !result.context) { setError(result.error); return; }
      setContext(result.context);
    });
  }

  function uploadEvidence(requirementKey: EvidenceRequirementKey, file: File | null) {
    setError(null);
    if (!file) return;
    const formData = new FormData();
    formData.set("groupId", context.groupId);
    formData.set("expectedVersion", String(context.version));
    formData.set("requirementKey", requirementKey);
    formData.set("evidenceFile", file);
    startTransition(async () => {
      const result = await uploadSubmissionEvidenceAction(formData);
      if (result.error || !result.context) { setError(result.error); return; }
      setContext(result.context);
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitSubmissionGroupAction({ groupId: context.groupId, expectedVersion: context.version, attested });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className={wizardStyles.wizard}>
      <ol className={wizardStyles.steps}>
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? wizardStyles.stepActive : undefined} aria-current={index === step ? "step" : undefined}>{label}</li>
        ))}
      </ol>
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}

      {step === 0 ? (
        <section className={styles.form}>
          <p className={styles.legend}>The <strong>account holder</strong> is the person whose accounts this is about. The <strong>representative</strong> is the person named to help.</p>
          <div className={wizardStyles.grid2}>
            <label className={styles.field}>Account holder&rsquo;s name
              <input value={details.principalName} onChange={(event) => setDetails({ ...details, principalName: event.target.value })} required />
            </label>
            <label className={styles.field}>Account holder&rsquo;s email
              <input type="email" value={details.principalEmail} onChange={(event) => setDetails({ ...details, principalEmail: event.target.value })} required />
            </label>
            <label className={styles.field}>Representative&rsquo;s name
              <input value={details.representativeName} onChange={(event) => setDetails({ ...details, representativeName: event.target.value })} required />
            </label>
            <label className={styles.field}>Representative&rsquo;s email
              <input type="email" value={details.representativeEmail} onChange={(event) => setDetails({ ...details, representativeEmail: event.target.value })} required />
            </label>
          </div>
          <fieldset className={wizardStyles.confirmationBasis}>
            <legend>Can the account holder confirm this request themselves, on their own, for each bank?</legend>
            <label className={styles.check}>
              <input type="radio" name="confirmationBasis" checked={details.principalConfirmationAvailable === true} onChange={() => setDetails({ ...details, principalConfirmationAvailable: true })} />
              <span><strong>Yes</strong><small>Each bank will send the account holder their own confirmation link.</small></span>
            </label>
            <label className={styles.check}>
              <input type="radio" name="confirmationBasis" checked={details.principalConfirmationAvailable === false} onChange={() => setDetails({ ...details, principalConfirmationAvailable: false })} />
              <span><strong>No, and here is why</strong><small>Banks will still send notice. A staff person will read your note before the bank starts.</small></span>
            </label>
          </fieldset>
          {details.principalConfirmationAvailable === false ? (
            <label className={styles.field}>Explain why the account holder cannot confirm on their own
              <textarea rows={3} value={details.principalConfirmationUnavailableReason} onChange={(event) => setDetails({ ...details, principalConfirmationUnavailableReason: event.target.value })} required />
            </label>
          ) : null}
          <div className={styles.actions}>
            <span />
            <button className={styles.primary} type="button" disabled={pending} onClick={saveDetails}>{pending ? "Saving…" : "Continue"}</button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className={styles.form}>
          <p className={styles.legend}>Banks named so far ({context.targets.length} of {MAX_SUBMISSION_TARGETS})</p>
          <ul className={wizardStyles.targetList}>
            {context.targets.map((target) => (
              <li key={target.id} className={wizardStyles.targetRow}>
                <div>
                  <strong>{target.targetLabel}</strong>
                  <span className={target.matchStatus === "matched" ? wizardStyles.badgeMatched : wizardStyles.badgePending}>
                    {target.matchStatus === "matched" ? "On Passage" : "Not on Passage yet"}
                  </span>
                </div>
                <button className={styles.secondary} type="button" disabled={pending} onClick={() => removeTarget(target.id)}>Remove</button>
              </li>
            ))}
          </ul>
          {context.targets.length < MAX_SUBMISSION_TARGETS ? (
            <div className={wizardStyles.addTarget}>
              {!unmatchedMode ? (
                <>
                  <label className={styles.field}>Search for a bank or credit union
                    <input value={targetQuery} onChange={(event) => runSearch(event.target.value)} placeholder="Start typing a bank name" />
                  </label>
                  {searchResults.length > 0 ? (
                    <ul className={wizardStyles.searchResults}>
                      {searchResults.map((result) => (
                        <li key={result.organizationId}>
                          <button type="button" className={selectedOrganization?.organizationId === result.organizationId ? wizardStyles.searchResultSelected : wizardStyles.searchResult} onClick={() => setSelectedOrganization(result)}>
                            {result.displayName} <small>{result.organizationType.replaceAll("_", " ")}</small>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <button className={styles.secondary} type="button" onClick={() => setUnmatchedMode(true)}>My bank isn&rsquo;t listed</button>
                </>
              ) : (
                <>
                  <p className={styles.legend}>Not on Passage yet. We can still note them. A bank on Passage can open a request when they join.</p>
                  <div className={wizardStyles.grid2}>
                    <label className={styles.field}>Bank name
                      <input value={targetLabel} onChange={(event) => setTargetLabel(event.target.value)} />
                    </label>
                    <label className={styles.field}>Bank type
                      <input value={targetType} onChange={(event) => setTargetType(event.target.value)} placeholder="For example, bank, credit union" />
                    </label>
                    <button className={styles.secondary} type="button" onClick={() => setUnmatchedMode(false)}>Search instead</button>
                  </div>
                </>
              )}
              <button className={styles.primary} type="button" disabled={pending || (!unmatchedMode && !selectedOrganization)} onClick={addTarget}>{pending ? "Adding…" : "Add bank"}</button>
            </div>
          ) : null}
          <div className={styles.actions}>
            <button className={styles.secondary} type="button" onClick={() => goTo(0)}>Back</button>
            <div>
              {!targetsComplete ? <p className={styles.legal}>Add at least {MIN_SUBMISSION_TARGETS} banks to continue.</p> : null}
              <button className={styles.primary} type="button" disabled={!targetsComplete} onClick={() => goTo(2)}>Continue</button>
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className={styles.form}>
          {(["power_of_attorney", "identity_evidence"] as const).map((key) => {
            const uploaded = context.evidence.find((item) => item.requirementKey === key);
            return (
              <div key={key} className={styles.document}>
                <div>
                  <strong>{SUBMISSION_EVIDENCE_LABELS[key]}</strong>
                  <span>{uploaded ? uploaded.originalFilename : "PDF, JPG, or PNG, up to 10MB"}</span>
                </div>
                <label className={`${styles.secondary} ${wizardStyles.uploadRow}`}>
                  {uploaded ? "Replace" : "Upload"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={(event) => uploadEvidence(key, event.target.files?.[0] ?? null)} />
                </label>
              </div>
            );
          })}
          <div className={styles.actions}>
            <button className={styles.secondary} type="button" onClick={() => goTo(1)}>Back</button>
            <button className={styles.primary} type="button" disabled={!evidenceComplete} onClick={() => goTo(3)}>Continue</button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className={styles.form}>
          <div className={styles.summary}>
            <h2>Check before send</h2>
            <p>{context.targets.length} bank{context.targets.length === 1 ? "" : "s"} named. {MULTI_INSTITUTION_CASE_INDEPENDENCE_NOTICE}</p>
          </div>
          <ul className={styles.scope}>
            {context.targets.map((target) => <li key={target.id}>{target.targetLabel}</li>)}
          </ul>
          <label className={styles.check}>
            <input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} />
            <span>I say that I am allowed to share these details with the banks I listed. Passage records what I said. It does not check whether I am allowed.<small>{PASSAGE_AUTHORITY_BOUNDARY_NOTICE}</small></span>
          </label>
          <div className={styles.actions}>
            <button className={styles.secondary} type="button" onClick={() => goTo(2)}>Back</button>
            <button className={styles.primary} type="button" disabled={pending || !attested} onClick={submit}>{pending ? "Sending…" : "Send request"}</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
