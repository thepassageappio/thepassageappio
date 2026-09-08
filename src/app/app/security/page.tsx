import { MfaFactorManager } from "@/components/app/MfaFactorManager";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

export default async function SecurityPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
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
      <MfaFactorManager initialFactors={factors} />
    </>
  );
}
