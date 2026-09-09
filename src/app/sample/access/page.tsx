import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { hasSampleAccessLead } from "@/lib/authority/sample-access";
import { grantSampleAccessAction } from "../actions";

type Props = { searchParams: Promise<{ error?: string }> };

export const metadata: Metadata = {
  title: "Unlock the Sample Workflow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SampleAccessPage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sample&next=/sample");
  if (await hasSampleAccessLead(access.user.id)) redirect("/sample");

  const query = await searchParams;
  const error = query.error === "consent_required"
    ? "Please confirm that Passage may contact you before opening the sample."
    : query.error === "lead_unavailable"
      ? "We could not unlock the sample just now. Please try again."
      : null;

  return (
    <AccountFrame
      eyebrow="One last step"
      title="Unlock the Passage sample"
      description="See a read-only, fictional authority request from invitation through the institution's final receipt."
    >
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      <form action={grantSampleAccessAction} className={styles.form}>
        <label className={styles.check}>
          <input name="sampleContactConsent" required type="checkbox" />
          <span>Passage may email me a short sample follow-up series, product updates, and a walkthrough invitation. I can unsubscribe at any time.</span>
        </label>
        <button className={styles.primary} type="submit">Agree and view sample</button>
        <p className={styles.legal}>
          We record this consent with your verified sign-in and keep it separate from authority and participant records. See the <Link href="/legal/privacy">privacy notice</Link>.
        </p>
      </form>
    </AccountFrame>
  );
}
