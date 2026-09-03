import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";

export default async function OnboardingCompletePage() {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sign-in");
  if (!access.membership || !access.organization) redirect("/onboarding/organization");
  if (access.organization.onboardingStatus === "terms_required") redirect("/onboarding/terms");
  if (access.organization.onboardingStatus === "template_required") redirect("/onboarding/template");

  return (
    <AccountFrame eyebrow="Workspace ready" title={`Welcome to ${access.organization.displayName}`} description="Your institution workspace and owner access are ready. Account holders and representatives will use secure links instead of creating accounts.">
      <div className={styles.complete}>
        <div className={styles.completeMark} aria-hidden="true">✓</div>
        <h2>Your evaluation is ready</h2>
        <p>Start a sample request now, or invite staff and reviewers who will test the process with you.</p>
        <div className={styles.rule}>
          <strong>Your free evaluation does not start yet.</strong><br />The 10-day clock and first of five sample requests begin only when your first participant invitation is sent.
        </div>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/app/team">Invite your team</Link>
          <Link className={styles.primary} href="/app/requests/new?sample=1">Start a sample request</Link>
        </div>
      </div>
    </AccountFrame>
  );
}
