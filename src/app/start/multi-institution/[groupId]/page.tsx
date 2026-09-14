import { redirect } from "next/navigation";
import { getRequesterSessionContextAction } from "@/app/multi-institution-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { MultiInstitutionWizard } from "./MultiInstitutionWizard";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ groupId: string }> };

export default async function MultiInstitutionWizardPage({ params }: Props) {
  const { groupId } = await params;
  const { context } = await getRequesterSessionContextAction(groupId);

  if (!context) {
    return (
      <AccountFrame eyebrow="Secure request" title="This session is no longer active" description="Your secure session may have expired, or this link was already used on a different device.">
        <div className={styles.alert} role="alert">Use the confirmation link from your email again, or start a new request.</div>
      </AccountFrame>
    );
  }

  if (context.status === "fanned_out") {
    redirect(`/start/multi-institution/${groupId}/submitted`);
  }

  return (
    <AccountFrame
      eyebrow={`Reference ${context.referenceCode}`}
      title="Build your request"
      description="Add the people involved, name up to five institutions, and upload the shared evidence packet once."
    >
      <MultiInstitutionWizard initialContext={context} />
    </AccountFrame>
  );
}
