import { redirect } from "next/navigation";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { createClient } from "@/lib/supabase/server";
import { MfaVerification } from "@/components/app/MfaVerification";
import styles from "./mfa.module.css";

export const dynamic = "force-dynamic";

export default async function MfaGatePage() {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sign-in");
  if (access.mfaGate === "allow") redirect("/app");

  let existingFactorId: string | null = null;
  if (access.mfaGate === "require_challenge") {
    const supabase = await createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    existingFactorId = data?.totp?.find((factor) => factor.status === "verified")?.id ?? null;
  }

  const isEnrollment = access.mfaGate === "require_enrollment";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Two-factor authentication</p>
        <h1>{isEnrollment ? "Set up two-factor authentication" : "Verify it's you"}</h1>
        <p className={styles.lede}>
          {isEnrollment
            ? "Owner and administrator accounts require an authenticator app before continuing. Scan the code below with an authenticator app (such as 1Password, Authy, or Google Authenticator), then enter the 6-digit code it shows."
            : "Enter the current 6-digit code from your authenticator app to continue."}
        </p>
        <MfaVerification mode={isEnrollment ? "enroll" : "challenge"} existingFactorId={existingFactorId} />
      </div>
    </main>
  );
}
