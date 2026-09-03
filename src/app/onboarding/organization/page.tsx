import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createOrganizationAction, signOutAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function OrganizationOnboardingPage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sign-in");
  if (access.membership?.status === "revoked") {
    return (
      <AccountFrame
        eyebrow="Organization access"
        title="Your previous organization access was removed"
        description="This account can no longer open that organization. Contact an organization owner if you believe access should be restored."
      >
        <div className={styles.alert} role="alert">
          No information from the previous organization is available to this account.
        </div>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/">Return to Passage Authority</Link>
          <form action={signOutAction}>
            <button className={styles.primary} type="submit">Sign out</button>
          </form>
        </div>
      </AccountFrame>
    );
  }
  if (access.organization?.onboardingStatus === "ready") redirect("/app");
  if (access.organization?.onboardingStatus === "template_required") redirect("/onboarding/template");
  if (access.organization?.onboardingStatus === "terms_required") redirect("/onboarding/terms");
  const { error: errorCode } = await searchParams;
  const error = userErrorMessage(errorCode);

  return (
    <AccountFrame
      eyebrow="Organization profile"
      title="Set up your organization"
      description="This information identifies the organization responsible for the evaluation and appears in participant invitations and decision receipts."
      step="Step 1 of 3"
    >
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      <form action={createOrganizationAction} className={styles.form}>
        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="legalName">Legal organization name</label>
            <input id="legalName" name="legalName" required type="text" />
          </div>
          <div className={styles.field}>
            <label htmlFor="displayName">Participant-facing name</label>
            <input id="displayName" name="displayName" required type="text" />
          </div>
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="organizationType">Organization type</label>
            <select defaultValue="" id="organizationType" name="organizationType" required>
              <option disabled value="">Choose one</option>
              <option value="regional_bank">Regional bank</option>
              <option value="credit_union">Credit union</option>
              <option value="elder_law_firm">Elder-law firm</option>
              <option value="authorized_service_organization">Authorized service organization</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="websiteDomain">Website domain</label>
            <input id="websiteDomain" name="websiteDomain" placeholder="institution.com" type="text" />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="addressLine1">Street address</label>
          <input autoComplete="address-line1" id="addressLine1" name="addressLine1" required type="text" />
          <small>Use your primary operating address. Manual entry remains available even when address suggestions are added.</small>
        </div>
        <div className={styles.field}>
          <label htmlFor="addressLine2">Suite or floor</label>
          <input autoComplete="address-line2" id="addressLine2" name="addressLine2" type="text" />
        </div>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label htmlFor="locality">City</label>
            <input autoComplete="address-level2" id="locality" name="locality" required type="text" />
          </div>
          <div className={styles.field}>
            <label htmlFor="region">State</label>
            <input autoComplete="address-level1" id="region" maxLength={2} name="region" required type="text" />
          </div>
          <div className={styles.field}>
            <label htmlFor="postalCode">ZIP code</label>
            <input autoComplete="postal-code" id="postalCode" name="postalCode" required type="text" />
          </div>
        </div>
        <label className={styles.check}>
          <input name="authorizedUse" required type="checkbox" />
          <span>
            I am authorized to evaluate Passage Authority for this organization.
            <small>I will only invite people and use information that I am permitted to use for this evaluation.</small>
          </span>
        </label>
        <button className={styles.primary} type="submit">Save organization</button>
      </form>
    </AccountFrame>
  );
}
