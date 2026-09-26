import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePublishedPermissionCatalog, offeredPublishedFinancialPoaPermissions } from "@/lib/authority/permission-catalog";
import { DraftRequestForm } from "./DraftRequestForm";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { canCoordinateAuthorityRequests } from "@/lib/authority/role-capabilities";
import { userErrorMessage } from "@/lib/authority/user-messages";
import styles from "@/components/app/app-shell.module.css";

type Props = { searchParams: Promise<{ error?: string; sample?: string }> };

export default async function NewHostedAuthorityRequest({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !canCoordinateAuthorityRequests(access.membership.role)) {
    redirect("/app?error=request_creation_not_allowed");
  }
  const supabase = await createClient();
  const { data, error: catalogError } = await supabase.rpc("get_published_permission_catalog_v1", { p_organization_id: access.membership.organizationId, p_authority_type_key: "financial_poa" });
  const catalog = parsePublishedPermissionCatalog(data);
  const offered = offeredPublishedFinancialPoaPermissions(catalog);
  if (catalogError || !catalog?.published || !offered.length) return <div className={styles.alert} role="alert"><h1>We could not load your request rules</h1><p>Reload this page before starting a request.</p><Link href="/app/requests/new">Reload</Link></div>;
  const { error, sample } = await searchParams;
  const message = userErrorMessage(error);
  const useSample = sample === "1";
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>New authority request</p><h1>Who needs help, and with which account?</h1><p>Save a draft first. Check the details before sending it. Drafts do not count toward your limit.</p>{useSample ? null : <Link className={styles.secondary} href="/app/requests/new?sample=1">Load sample details</Link>}</div>
    </header>
    {message ? <div className={styles.alert} role="alert">{message}</div> : null}
    {useSample ? <div className={styles.notice} role="status"><strong>Sample details are ready.</strong> Use two test email addresses you can open separately. Download the <a href="/samples/fictional-poa.pdf" download>fictional POA</a> and <a href="/samples/fictional-identity.pdf" download>fictional identity file</a> for the representative upload steps.</div> : null}
    <DraftRequestForm offered={offered} publishedVersionId={catalog.published.id} useSample={useSample} endDate={defaultEndDate.toISOString().slice(0, 10)} idempotencyKey={randomUUID()} />
  </>;
}
