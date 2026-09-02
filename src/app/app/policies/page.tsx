import { getAuthorityAccessContext } from "@/lib/authority/access";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

export default async function PoliciesPage() {
  const access = await getAuthorityAccessContext();
  if (!access?.membership) return null;
  const supabase = await createClient();
  const { data: selection } = await supabase.from("organization_template_selections").select("template_key, template_version, selected_at").eq("organization_id", access.membership.organizationId).maybeSingle();

  return (
    <>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Authority policy</p><h1>New York financial POA</h1><p>The institution defines its requirements and keeps the final authority decision. Passage coordinates the transaction and preserves the result.</p></div><span className={styles.badge}>Active</span></header>
      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Initial authority scope</h2><p>Limited, non-transactional account-service actions only.</p></div></div>
          <div className={styles.policyScope}>
            <div className={styles.scopeCard}><h3>May be requested</h3><ul><li>Receive duplicate statements for a named account boundary</li><li>Discuss defined account-service questions</li></ul></div>
            <div className={styles.scopeCard} data-tone="caution"><h3>Never included in this release</h3><ul><li>Move, withdraw, or transfer money</li><li>Open or close accounts</li><li>Change owners, beneficiaries, credentials, or investments</li></ul></div>
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Policy record</h2><p>The selected version remains attached to every future decision.</p></div></div>
          <dl className={styles.policyFacts}><div><dt>Template</dt><dd>New York financial POA</dd></div><div><dt>Version</dt><dd>{selection?.template_version ?? "2026.1"}</dd></div><div><dt>Decision owner</dt><dd>Receiving institution</dd></div><div><dt>Automatic legal decision</dt><dd>Never</dd></div></dl>
        </section>
      </div>
    </>
  );
}
