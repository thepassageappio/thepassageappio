import { MfaFactorManager } from "@/components/app/MfaFactorManager";
import { MfaTeamStatus } from "@/components/app/MfaTeamStatus";
import { parseMfaTeamStatus } from "@/lib/authority/mfa-team-status";
import { createClient } from "@/lib/supabase/server";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { roleRequiresMfa } from "@/lib/authority/mfa-policy";
import { redirect } from "next/navigation";
import styles from "@/components/app/app-shell.module.css";

export default async function SecurityPage() {
  const access = await getAuthorityAccessContext();
  if (!roleRequiresMfa(access?.membership?.role) || !access?.organization) redirect("/app");
  if (access.mfaGate !== "allow") redirect("/mfa");
  const supabase = await createClient();
  const [{ data, error: factorError }, team] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.rpc("get_privileged_mfa_status_v1", { p_organization_id: access.organization.id }),
  ]);
  const factors = (data?.totp ?? [])
    .filter((factor) => factor.status === "verified")
    .map((factor, index) => ({
      id: factor.id,
      friendlyName: factor.friendly_name?.trim() || `Authenticator ${index + 1}`,
      createdAt: factor.created_at,
    }));

  return (
    <>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>Sign-in security</p><h1>Authenticator recovery</h1><p>Keep two verified authenticators so losing one device does not lock you out of privileged work.</p></div>
      </header>
      {factorError ? <p role="status">Your authenticators could not be loaded. Refresh this page before managing enrollment.</p> : <MfaFactorManager initialFactors={factors} />}
      <MfaTeamStatus status={team.error ? null : parseMfaTeamStatus(team.data)} />
    </>
  );
}
