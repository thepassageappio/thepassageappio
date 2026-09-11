import { getAuthorityAccessContext } from "@/lib/authority/access";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

export default async function PoliciesPage() {
  const access = await getAuthorityAccessContext();
  if (!access?.membership) return null;
  const supabase = await createClient();
  const { data: selection, error } = await supabase.from("organization_template_selections").select("template_key, template_version, selected_at").eq("organization_id", access.membership.organizationId).maybeSingle();

  if (error) return <PolicyNotice title="We could not load your policy" detail="Reload this page to try again. If it still does not load, ask your organization owner for help." retry />;
  if (!selection) return <PolicyNotice title="No policy selected" detail="Ask your organization owner to finish the policy step in organization setup." />;
  if (selection.template_key !== "ny_financial_poa" || selection.template_version !== "2026.1") {
    return <PolicyNotice title="This saved policy is not supported" detail="This version of Passage cannot show the saved policy. Ask your organization owner to check the policy setup." />;
  }

  return (
    <>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Request rules</p><h1>New York financial power of attorney</h1><p>This checklist is for sample requests. The bank or credit union reviews the documents and decides what the representative may do.</p></div><span className={styles.badge}>Selected</span></header>
      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>What this sample covers</h2><p>The sample covers statement copies and account questions. You cannot change the institution’s rules in Passage yet.</p></div></div>
          <div className={styles.policyScope}>
            <div className={styles.scopeCard}><h3>May be requested</h3><ul><li>Get statement copies for the named account</li><li>Ask about account service issues listed in the request</li></ul></div>
            <div className={styles.scopeCard} data-tone="caution"><h3>Not available in Passage yet</h3><ul><li>Move, withdraw, or transfer money</li><li>Open or close accounts</li><li>Change account owners or beneficiaries</li><li>Change sign-in details or investments</li></ul></div>
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Saved policy</h2><p>Your organization selected this policy. Each request records the policy name and version used to prepare it.</p></div></div>
          <dl className={styles.policyFacts}><div><dt>Policy</dt><dd>New York financial power of attorney</dd></div><div><dt>Version</dt><dd>{selection.template_version}</dd></div><div><dt>Who decides?</dt><dd>The bank or credit union</dd></div><div><dt>Does Passage decide if the document is legally valid?</dt><dd>No. The institution reviews it.</dd></div></dl>
        </section>
      </div>
    </>
  );
}

function PolicyNotice({ title, detail, retry = false }: { title: string; detail: string; retry?: boolean }) {
  return <>
    <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Request rules</p><h1>{title}</h1><p>{detail}</p></div></header>
    {retry ? <form method="get"><button className={styles.primary} type="submit">Reload policy</button></form> : null}
  </>;
}
