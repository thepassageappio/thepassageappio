import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { isDemoEmailRecipientAllowed } from "./delivery-boundary.ts";

export type ReconciliationAlertSummary = { status: string; runDate: string | null };

export type ReconciliationAlertResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "recipient_not_allowed" | "provider_rejected" };

type AlertEmail = { from: string; to: string; subject: string; text: string };
type AlertSender = (apiKey: string, email: AlertEmail, idempotencyKey: string) => Promise<{ error?: unknown } | null | undefined>;

const sendWithResend: AlertSender = async (apiKey, email, idempotencyKey) =>
  new Resend(apiKey).emails.send(email, { headers: { "Idempotency-Key": idempotencyKey } });

export function buildReconciliationAlertEmail(summary: ReconciliationAlertSummary, environment: string | undefined) {
  const envLabel = environment?.trim() || "unknown";
  const runDate = summary.runDate ?? "not recorded";
  return {
    subject: `Passage Authority (${envLabel}): daily reconciliation is ${summary.status}`,
    text: [
      "The daily reconciliation check did not come back clean.",
      "",
      `Environment: ${envLabel}`,
      `Status: ${summary.status}`,
      `Run date: ${runDate}`,
      "",
      "Check authority_private.reconciliation_runs in Supabase for the details.",
      "This email is only sent when the result is not clean.",
    ].join("\n"),
  };
}

// Sends one plain alert email. Never throws: a failed or skipped alert must not change the cron response.
export async function sendReconciliationAlert(
  summary: ReconciliationAlertSummary,
  env: Record<string, string | undefined> = process.env,
  send: AlertSender = sendWithResend,
): Promise<ReconciliationAlertResult> {
  try {
    const to = env.AUTHORITY_OPS_ALERT_EMAIL?.trim();
    const from = env.AUTHORITY_EMAIL_FROM?.trim();
    const apiKey = env.RESEND_API_KEY?.trim();
    if (!to || !from || !apiKey) return { sent: false, reason: "not_configured" };
    if (!isDemoEmailRecipientAllowed(to, env.PASSAGE_ENVIRONMENT, env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST)) {
      return { sent: false, reason: "recipient_not_allowed" };
    }
    const message = buildReconciliationAlertEmail(summary, env.PASSAGE_ENVIRONMENT);
    const day = summary.runDate ?? new Date().toISOString().slice(0, 10);
    const response = await send(apiKey, { from, to, ...message }, `authority-reconciliation-alert-${day}-${summary.status}`);
    if (response?.error) {
      console.error("reconciliation_alert_not_sent", { reason: "provider_rejected" });
      return { sent: false, reason: "provider_rejected" };
    }
    return { sent: true };
  } catch {
    console.error("reconciliation_alert_not_sent", { reason: "provider_rejected" });
    return { sent: false, reason: "provider_rejected" };
  }
}

type AlertFn = (summary: ReconciliationAlertSummary) => Promise<unknown>;

async function alertSafely(alert: AlertFn, summary: ReconciliationAlertSummary) {
  try {
    await alert(summary);
  } catch {
    // Alerting must never change the cron HTTP contract.
  }
}

export async function dailyReconciliationResponse(
  request: Request,
  configuredSecret: string | undefined,
  run: () => Promise<unknown>,
  alert: AlertFn = (summary) => sendReconciliationAlert(summary),
) {
  const secret = Buffer.from(configuredSecret?.trim() ?? "");
  const supplied = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const headers = { "Cache-Control": "private, no-store" };
  if (!secret.length || secret.length !== supplied.length || !timingSafeEqual(secret, supplied)) return Response.json({ok:false}, {status:404,headers});
  let result: unknown;
  try {
    result = await run();
    if (!result || typeof result !== "object" || !("status" in result) || !("run_date" in result)) throw new Error("invalid_result");
  } catch {
    await alertSafely(alert, { status: "error", runDate: null });
    return Response.json({ok:false}, {status:503,headers});
  }
  const row = result as Record<string, unknown>;
  const clean = row.status === "clean";
  if (!clean) await alertSafely(alert, { status: String(row.status), runDate: row.run_date == null ? null : String(row.run_date) });
  return Response.json({ok:clean,status:row.status,run_date:row.run_date,already_recorded_today:row.already_recorded_today===true}, {status:clean?200:409,headers});
}
