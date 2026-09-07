"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/mfa/mfa.module.css";

type Props = {
  mode: "enroll" | "challenge";
  existingFactorId: string | null;
};

type EnrollState =
  | { status: "loading" }
  | { status: "ready"; factorId: string; qrSvg: string; secret: string }
  | { status: "error"; message: string };

export function MfaVerification({ mode, existingFactorId }: Props) {
  const [supabase] = useState(() => createClient());
  const [enroll, setEnroll] = useState<EnrollState>({ status: "loading" });
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "enroll") return;
    let cancelled = false;

    async function startEnrollment() {
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const stale = existing?.totp?.filter((factor) => factor.status === "unverified") ?? [];
      for (const factor of stale) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (cancelled) return;
      if (error || !data?.totp) {
        setEnroll({ status: "error", message: "Could not start two-factor setup. Reload this page to try again." });
        return;
      }
      setEnroll({ status: "ready", factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret });
    }

    startEnrollment();
    return () => {
      cancelled = true;
    };
  }, [mode, supabase]);

  const factorId = mode === "enroll" ? (enroll.status === "ready" ? enroll.factorId : null) : existingFactorId;

  function handleVerify() {
    if (!factorId) return;
    setVerifyError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (error) {
        setVerifyError("That code did not match. Check the time on your device and try again.");
        return;
      }
      window.location.assign("/app");
    });
  }

  if (mode === "challenge" && !existingFactorId) {
    return (
      <p className={styles.error}>
        We could not find your authenticator. Reload this page, or contact your administrator if this continues.
      </p>
    );
  }

  return (
    <div>
      {mode === "enroll" && enroll.status === "loading" && <p>Preparing your authenticator setup...</p>}
      {mode === "enroll" && enroll.status === "error" && <p className={styles.error}>{enroll.message}</p>}
      {mode === "enroll" && enroll.status === "ready" && (
        <div className={styles.qrBlock}>
          <div className={styles.qr} dangerouslySetInnerHTML={{ __html: enroll.qrSvg }} />
          <p className={styles.secretLabel}>Can&apos;t scan it? Enter this code manually:</p>
          <code className={styles.secret}>{enroll.secret}</code>
        </div>
      )}

      <label className={styles.fieldLabel} htmlFor="mfa-code">
        6-digit code
      </label>
      <input
        id="mfa-code"
        className={styles.codeInput}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
      />
      {verifyError && <p className={styles.error}>{verifyError}</p>}
      <button
        type="button"
        className={styles.submit}
        disabled={isPending || code.trim().length < 6 || !factorId}
        onClick={handleVerify}
      >
        {isPending ? "Verifying..." : "Verify and continue"}
      </button>
    </div>
  );
}
