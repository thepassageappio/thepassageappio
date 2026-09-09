"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/app/app-shell.module.css";
import mfaStyles from "@/app/mfa/mfa.module.css";

type Factor = { id: string; friendlyName: string; createdAt: string };
type Enrollment = { factorId: string; qrSvg: string; secret: string } | null;

export function MfaFactorManager({ initialFactors }: { initialFactors: Factor[] }) {
  const [supabase] = useState(() => createClient());
  const [factors] = useState(initialFactors);
  const [enrollment, setEnrollment] = useState<Enrollment>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startBackupEnrollment() {
    setMessage(null);
    startTransition(async () => {
      const { data: listed, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        setMessage("Could not inspect your authenticators. Reload the page and try again.");
        return;
      }
      for (const factor of listed.all) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          const { error: cleanupError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (cleanupError) {
            setMessage("Could not clear an unfinished authenticator setup. Reload the page and try again.");
            return;
          }
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Backup authenticator ${factors.length + 1}`,
      });
      if (error || !data?.totp) {
        setMessage("Could not start backup setup. Reload the page and try again.");
        return;
      }
      setEnrollment({ factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret });
    });
  }

  function verifyBackup() {
    if (!enrollment || code.length !== 6) return;
    setMessage(null);
    startTransition(async () => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.factorId, code });
      if (error) {
        setMessage("That code did not match. Check the backup device and try again.");
        return;
      }
      window.location.reload();
    });
  }

  return (
    <>
      {message ? <div className={styles.alert} role="alert">{message}</div> : null}
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Verified authenticators</h2><p>Use a separate device or securely stored TOTP secret for the backup factor.</p></div><span className={styles.badge}>{factors.length} verified</span></div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Name</th><th>Added</th><th>Status</th></tr></thead>
            <tbody>{factors.map((factor) => <tr key={factor.id}><td><strong>{factor.friendlyName}</strong></td><td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(factor.createdAt))}</td><td><span className={styles.badge}>Verified</span></td></tr>)}</tbody>
          </table>
        </div>
        <p>Verified factors cannot be removed from this screen. Removal requires the controlled recovery process so the change can be authorized and audited.</p>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Add a backup authenticator</h2><p>A backup factor keeps you signed in if the primary device is lost. Passage does not issue recovery codes.</p></div></div>
        {!enrollment ? <button className={styles.primary} disabled={isPending} onClick={startBackupEnrollment} type="button">{isPending ? "Preparing…" : "Add backup authenticator"}</button> : (
          <div className={mfaStyles.qrBlock}>
            <Image
              alt="QR code for adding a backup Passage authenticator"
              className={mfaStyles.qrImage}
              height={200}
              src={enrollment.qrSvg}
              unoptimized
              width={200}
            />
            <p className={mfaStyles.secretLabel}>Can&apos;t scan it? Enter this code manually:</p>
            <code className={mfaStyles.secret}>{enrollment.secret}</code>
            <label className={mfaStyles.fieldLabel} htmlFor="backup-mfa-code">6-digit code from the backup authenticator</label>
            <input id="backup-mfa-code" className={mfaStyles.codeInput} inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))} />
            <button className={styles.primary} disabled={isPending || code.length !== 6} onClick={verifyBackup} type="button">{isPending ? "Verifying…" : "Verify backup"}</button>
          </div>
        )}
      </section>
    </>
  );
}
