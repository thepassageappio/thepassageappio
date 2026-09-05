import Link from "next/link";
import { createFoundingPilotInvoiceAction } from "@/app/billing-actions";
import styles from "@/components/app/app-shell.module.css";
import { getAuthorityAccessContext, roleLabel } from "@/lib/authority/access";
import { defaultPilotPeriod } from "@/lib/authority/pilot-billing";
import { canManageBilling, canManageMembers, canViewOrganizationAudit, hasOrganizationCapability } from "@/lib/authority/role-capabilities";
import { createClient } from "@/lib/supabase/server";

const organizationTypeLabels: Record<string, string> = {
  regional_bank: "Regional bank",
  credit_union: "Credit union",
  elder_law_firm: "Elder law firm",
  authorized_service_organization: "Authorized service organization",
};

const offerLabels: Record<string, string> = {
  free_evaluation: "Evaluation",
  pilot: "Founding pilot",
  enterprise: "Institution plan",
};

const statusLabels: Record<string, string> = {
  not_started: "Ready to start",
  active: "Active",
  past_due: "Payment attention needed",
  canceled: "Canceled",
  expired: "Ended",
};

function formatDate(value: string | null) {
  if (!value) return "Begins with the first activated request";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

type OrganizationPageProps = { searchParams: Promise<{ billing?: string }> };

export default async function OrganizationPage({ searchParams }: OrganizationPageProps) {
  const query = await searchParams;
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !access.organization) return null;

  const role = access.membership.role;
  const canManageAccess = canManageMembers(role);
  const mayManageBilling = canManageBilling(role);
  const mayViewBilling = hasOrganizationCapability(role, "billing.view");
  const mayViewAudit = canViewOrganizationAudit(role);
  const supabase = await createClient();
  const [planResult, memberResult, invitationResult, templateResult, auditResult, billingResult] = await Promise.all([
    supabase.from("organization_entitlements").select("offer, status, transaction_limit, activated_count, period_started_at, period_ends_at, version").eq("organization_id", access.organization.id).maybeSingle(),
    supabase.from("organization_memberships").select("role, status").eq("organization_id", access.organization.id),
    canManageAccess
      ? supabase.from("organization_invitations").select("status, expires_at").eq("organization_id", access.organization.id).eq("status", "pending")
      : Promise.resolve({ data: [] }),
    supabase.from("organization_template_selections").select("template_key, template_version").eq("organization_id", access.organization.id).maybeSingle(),
    mayViewAudit
      ? supabase.from("organization_audit_events").select("event_id", { count: "exact", head: true }).eq("organization_id", access.organization.id)
      : Promise.resolve({ count: null }),
    mayViewBilling
      ? supabase.rpc("get_organization_billing_status_v1", { p_organization_id: access.organization.id })
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (planResult.error) throw planResult.error;
  if (memberResult.error) throw memberResult.error;
  if ("error" in invitationResult && invitationResult.error) throw invitationResult.error;
  if (templateResult.error) throw templateResult.error;
  if ("error" in auditResult && auditResult.error) throw auditResult.error;
  if (billingResult.error) throw billingResult.error;

  const plan = planResult.data;
  const members = memberResult.data ?? [];
  const pendingInvitations = invitationResult.data ?? [];
  const activeMembers = members.filter((member) => member.status === "active");
  const activeOwners = activeMembers.filter((member) => member.role === "owner");
  const expiredInvitations = pendingInvitations.filter((invitation) => new Date(invitation.expires_at) <= new Date());
  const offer = String(plan?.offer ?? "free_evaluation");
  const used = Number(plan?.activated_count ?? 0);
  const limit = plan?.transaction_limit == null ? null : Number(plan.transaction_limit);
  const isEvaluation = offer === "free_evaluation";
  const billing = billingResult.data as {
    order_id?: string;
    status?: string;
    hosted_invoice_url?: string;
    invoice_number?: string;
  } | null;
  const pilotPeriod = defaultPilotPeriod();
  const billingMessages: Record<string, string> = {
    invoice_open: "A pilot invoice is already open. Use the hosted invoice link below.",
    plan_changed: "The plan changed while the invoice was being prepared. Review the latest status and try again.",
    not_allowed: "Your role cannot prepare institution billing.",
    provider_unavailable: "The billing provider is temporarily unavailable. The request is recorded for retry.",
    invalid: "Review the pilot dates and request allowance, then try again.",
  };
  const setupControls = [
    { label: "Organization identity", detail: "Legal name, display name, and institution type are recorded.", complete: Boolean(access.organization.legalName && access.organization.displayName) },
    { label: "Accountable owner", detail: "At least one active owner is responsible for organization access.", complete: activeOwners.length >= 1 },
    { label: "Backup owner", detail: activeOwners.length >= 2 ? "A second owner protects account recovery." : "Add or promote a second owner before controlled data.", complete: activeOwners.length >= 2 },
    { label: "Separated team roles", detail: activeMembers.length >= 2 ? "Multiple people can hold distinct operating and review roles." : "Invite an operator or reviewer to prove separation of duties.", complete: activeMembers.length >= 2 },
    { label: "Authority policy", detail: templateResult.data ? `Policy ${templateResult.data.template_version} is attached to new requests.` : "Select a policy before requests begin.", complete: Boolean(templateResult.data) },
    { label: "Evaluation entitlement", detail: plan ? "Usage and access-period limits are tracked by Passage." : "The evaluation allowance is not available.", complete: Boolean(plan) },
    { label: "Invitation recovery", detail: expiredInvitations.length === 0 ? "No expired invitation needs attention." : `${expiredInvitations.length} expired invitation${expiredInvitations.length === 1 ? "" : "s"} need replacement.`, complete: expiredInvitations.length === 0 },
  ];
  const completeControls = setupControls.filter((control) => control.complete).length;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Organization administration</p>
          <h1>{access.organization.displayName}</h1>
          <p>One place to understand organization identity, accountable access, policy, billing, integrations, and the controls still required for a pilot.</p>
        </div>
        <span className={styles.badge}>{roleLabel(role)}</span>
      </header>

      <nav className={styles.adminTabs} aria-label="Organization administration sections">
        <Link aria-current="page" href="/app/organization">Overview</Link>
        <Link href="/app/team">People and roles</Link>
        <Link href="/app/policies">Policies and workflow</Link>
      </nav>

      {query.billing && billingMessages[query.billing] ? <p className={styles.alert}>{billingMessages[query.billing]}</p> : null}

      <section className={styles.readinessPanel} aria-labelledby="readiness-heading">
        <div className={styles.readinessSummary}>
          <div><p className={styles.eyebrow}>Evaluation readiness</p><h2 id="readiness-heading">{completeControls} of {setupControls.length} controls ready</h2><p>This score describes the current workspace setup. It is not a security certification or production approval.</p></div>
          <div className={styles.readinessScore} aria-label={`${completeControls} of ${setupControls.length} controls ready`}><strong>{completeControls}</strong><span>of {setupControls.length}</span></div>
        </div>
        <ul className={styles.readinessList}>{setupControls.map((control) => <li data-complete={control.complete} key={control.label}><span aria-hidden="true">{control.complete ? "✓" : "!"}</span><div><strong>{control.label}</strong><p>{control.detail}</p></div><small>{control.complete ? "Ready" : "Attention"}</small></li>)}</ul>
        {canManageAccess ? <div className={styles.panelActions}><Link className={styles.primary} href="/app/team">Manage people and roles</Link></div> : null}
      </section>

      <section className={`${styles.metricGrid} ${styles.compactMetrics}`} aria-label="Organization summary">
        <div className={styles.metric}><span>Active members</span><strong>{activeMembers.length}</strong></div>
        <div className={styles.metric}><span>Pending invitations</span><strong>{pendingInvitations.length}</strong></div>
        <div className={styles.metric}><span>Recorded admin events</span><strong>{mayViewAudit ? auditResult.count ?? 0 : "Role limited"}</strong></div>
      </section>

      <div className={styles.grid} style={{ marginTop: 17 }}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Institution account</h2><p>Every team member has a separate identity and an explicit organization role.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Display name</dt><dd>{access.organization.displayName}</dd></div>
            <div><dt>Legal name</dt><dd>{access.organization.legalName}</dd></div>
            <div><dt>Organization type</dt><dd>{organizationTypeLabels[access.organization.organizationType] ?? "Institution"}</dd></div>
            <div><dt>Your access</dt><dd>{roleLabel(role)}</dd></div>
            <div><dt>Workspace status</dt><dd>{access.organization.status === "active" ? "Active" : "Unavailable"}</dd></div>
          </dl>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Plan and billing</h2><p>Only the institution pays Passage. Account holders and representatives are never charged.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Current plan</dt><dd>{offerLabels[offer] ?? "Custom plan"}</dd></div>
            <div><dt>Plan status</dt><dd>{statusLabels[String(plan?.status ?? "not_started")] ?? "Contact support"}</dd></div>
            <div><dt>Requests used</dt><dd>{limit == null ? used : `${used} of ${limit}`}</dd></div>
            <div><dt>Price</dt><dd>{isEvaluation ? "$0 evaluation" : offer === "pilot" ? "$5,000 pilot" : "Contracted"}</dd></div>
            <div><dt>Payment method</dt><dd>{isEvaluation ? "Not required" : "Institution invoice"}</dd></div>
            {billing?.invoice_number ? <div><dt>Latest invoice</dt><dd>{billing.invoice_number}</dd></div> : null}
            {billing?.status ? <div><dt>Invoice status</dt><dd>{statusLabels[billing.status] ?? billing.status.replaceAll("_", " ")}</dd></div> : null}
            <div><dt>Period starts</dt><dd>{formatDate(plan?.period_started_at ?? null)}</dd></div>
            <div><dt>Period ends</dt><dd>{formatDate(plan?.period_ends_at ?? null)}</dd></div>
          </dl>
          {billing?.hosted_invoice_url ? <div className={styles.panelActions}><a className={styles.primary} href={billing.hosted_invoice_url} target="_blank" rel="noreferrer">Open hosted invoice</a></div> : null}
          {mayManageBilling && !billing?.hosted_invoice_url && isEvaluation ? <form action={createFoundingPilotInvoiceAction} className={styles.billingForm}>
            <input type="hidden" name="expectedEntitlementVersion" value={Number(plan?.version ?? 0)} />
            <input type="hidden" name="idempotencyKey" value={crypto.randomUUID()} />
            <div className={styles.field}><label htmlFor="pilot-start">Pilot starts</label><input id="pilot-start" name="servicePeriodStart" type="date" defaultValue={pilotPeriod.servicePeriodStart} required /></div>
            <div className={styles.field}><label htmlFor="pilot-end">Pilot ends</label><input id="pilot-end" name="servicePeriodEnd" type="date" defaultValue={pilotPeriod.servicePeriodEnd} required /></div>
            <div className={styles.field}><label htmlFor="pilot-allowance">Request allowance</label><input id="pilot-allowance" name="requestAllowance" type="number" min="1" max="500" defaultValue="25" required /></div>
            <button className={styles.primary} type="submit">Prepare $5,000 test invoice</button>
            <p>Demo test mode only. This records the service period and allowance before opening Stripe’s hosted invoice.</p>
          </form> : mayManageBilling && !billing?.hosted_invoice_url ? <div className={styles.panelActions}><Link className={styles.primary} href="/contact?topic=billing">Contact billing support</Link></div> : null}
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Controlled-data pilot gates</h2><p>These are intentionally visible instead of being implied by a completed evaluation.</p></div><span className={styles.badge}>Before pilot</span></div>
        <div className={styles.gateGrid}>
          <div><strong>Identity security</strong><p>Verified organization domain and privileged-user MFA enforcement.</p><small>Not yet configured</small></div>
          <div><strong>Commercial operations</strong><p>Named billing contact, approved invoice path, and reconciled entitlement.</p><small>{isEvaluation ? "Required for pilot" : "Plan connected"}</small></div>
          <div><strong>Integration assurance</strong><p>Provider delivery health, audit export, retention owner, and tested recovery.</p><small>Evidence still required</small></div>
        </div>
      </section>
    </>
  );
}
