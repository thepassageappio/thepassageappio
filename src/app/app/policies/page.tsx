import { randomUUID } from "node:crypto";
import { publishFinancialPoaPermissionSetAction } from "@/app/policy-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { NY_PACK_REF, jurisdictionPackVersionLabel } from "@/lib/authority/jurisdiction-pack";
import {
  FINANCIAL_POA_AUTHORITY_TYPE_KEY,
  offeredFinancialPoaPermissions,
  parsePublishedPermissionCatalog,
} from "@/lib/authority/permission-catalog";
import { userErrorMessage, userNoticeMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

type Props = { searchParams: Promise<{ error?: string; notice?: string }> };

export default async function PoliciesPage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.membership) return null;
  const supabase = await createClient();
  const { data: selection, error } = await supabase
    .from("organization_template_selections")
    .select("template_key, template_version, selected_at")
    .eq("organization_id", access.membership.organizationId)
    .maybeSingle();

  if (error) {
    return (
      <PolicyNotice
        title="We could not load your policy"
        detail="Reload this page to try again. If it still does not load, ask your organization owner for help."
        retry
      />
    );
  }
  if (!selection) {
    return (
      <PolicyNotice
        title="No policy selected"
        detail="Ask your organization owner to finish the policy step in organization setup."
      />
    );
  }
  if (selection.template_key !== "ny_financial_poa" || selection.template_version !== "2026.1") {
    return (
      <PolicyNotice
        title="This saved policy is not supported"
        detail="This version of Passage cannot show the saved policy. Ask your organization owner to check the policy setup."
      />
    );
  }

  const packLabel = jurisdictionPackVersionLabel(NY_PACK_REF);
  const canPublish = access.membership.role === "owner" || access.membership.role === "admin";
  const query = await searchParams;
  const pageError = userErrorMessage(query.error);
  const pageNotice = userNoticeMessage(query.notice);

  const { data: publishedRaw } = await supabase.rpc("get_published_permission_catalog_v1", {
    p_organization_id: access.membership.organizationId,
    p_authority_type_key: FINANCIAL_POA_AUTHORITY_TYPE_KEY,
  });
  const published = parsePublishedPermissionCatalog(publishedRaw);
  const offered =
    published && published.items.length > 0
      ? published.items.map((item) => ({
          key: item.permission_key,
          label: item.label,
          help: item.help,
        }))
      : offeredFinancialPoaPermissions();
  const versionLabel = published?.published?.version ?? "Not published yet";
  const publishedAt = published?.published?.published_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(published.published.published_at))
    : null;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Request rules</p>
          <h1>New York financial power of attorney</h1>
          <p>
            This checklist is for sample requests. The bank or credit union reviews the documents and
            decides what the representative may do.
          </p>
        </div>
        <span className={styles.badge}>Selected</span>
      </header>
      {pageError ? (
        <div className={styles.alert} role="alert">
          {pageError}
        </div>
      ) : null}
      {pageNotice ? (
        <div className={styles.notice} role="status">
          {pageNotice}
        </div>
      ) : null}
      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>What people may ask for</h2>
              <p>
                These are the asks your organization currently offers on new New York financial power of
                attorney requests. Other kinds of requests are not available in Passage yet.
              </p>
            </div>
          </div>
          <dl className={styles.policyFacts}>
            <div>
              <dt>Version used on new requests</dt>
              <dd>{versionLabel}</dd>
            </div>
            {publishedAt ? (
              <div>
                <dt>Last saved for new requests</dt>
                <dd>{publishedAt}</dd>
              </div>
            ) : null}
          </dl>
          <ul className={styles.checklist}>
            {offered.map((item) => (
              <li key={item.key}>
                <strong>{item.label}</strong>
                <span style={{ display: "block", marginTop: 4, color: "var(--muted)", fontWeight: 500 }}>
                  {item.help}
                </span>
              </li>
            ))}
          </ul>
          {canPublish && published?.published?.id ? (
            <div className={styles.panelActions}>
              <form action={publishFinancialPoaPermissionSetAction}>
                <input name="expectedPublishedVersionId" type="hidden" value={published.published.id} />
                <input name="idempotencyKey" type="hidden" value={randomUUID()} />
                <input name="publishReason" type="hidden" value="Save for new requests" />
                <button className={styles.primary} type="submit">
                  Save for new requests
                </button>
              </form>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 11, lineHeight: 1.5 }}>
                Open drafts keep the list they already have until someone updates them. Saving does not
                change decisions already made.
              </p>
            </div>
          ) : null}
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>What this sample covers</h2>
              <p>
                The sample covers statement copies and account questions. You cannot change the
                institution’s rules in Passage yet.
              </p>
            </div>
          </div>
          <div className={styles.policyScope}>
            <div className={styles.scopeCard}>
              <h3>May be requested</h3>
              <ul>
                <li>Get copies of account statements</li>
                <li>Talk with the bank about the account</li>
              </ul>
            </div>
            <div className={styles.scopeCard} data-tone="caution">
              <h3>Not available in Passage yet</h3>
              <ul>
                <li>Move, withdraw, or transfer money</li>
                <li>Open or close accounts</li>
                <li>Change account owners or beneficiaries</li>
                <li>Change sign-in details or investments</li>
              </ul>
            </div>
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Saved policy</h2>
              <p>
                Your organization selected this policy. Each request records the policy name and version
                used to prepare it.
              </p>
            </div>
          </div>
          <dl className={styles.policyFacts}>
            <div>
              <dt>Policy</dt>
              <dd>New York financial power of attorney</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{selection.template_version}</dd>
            </div>
            <div>
              <dt>New York rules</dt>
              <dd>{packLabel}</dd>
            </div>
            <div>
              <dt>Who decides?</dt>
              <dd>The bank or credit union</dd>
            </div>
            <div>
              <dt>Does Passage decide if the document is legally valid?</dt>
              <dd>No. The institution reviews it.</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}

function PolicyNotice({ title, detail, retry = false }: { title: string; detail: string; retry?: boolean }) {
  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Request rules</p>
          <h1>{title}</h1>
          <p>{detail}</p>
        </div>
      </header>
      {retry ? (
        <form method="get">
          <button className={styles.primary} type="submit">
            Reload policy
          </button>
        </form>
      ) : null}
    </>
  );
}
