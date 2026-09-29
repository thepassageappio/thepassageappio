import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { isDemoEmailRecipientAllowed } from "./delivery-boundary.ts";
import { readReleaseProvenance } from "./release-provenance.ts";

export type ReconciliationAlertSummary = { status: string; runDate: string | null };

export type ReconciliationAlertResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "recipient_not_allowed" | "provider_rejected" };

type AlertEmail = { from: string; to: string; subject: string; text: string };
type AlertSender = (apiKey: string, email: AlertEmail, idempotencyKey: string) => Promise<{ error?: unknown } | null | undefined>;

type AlertSkipLogReason = "no_address" | "not_configured" | "allowlist_blocked" | "resend_error";

// One line per skipped alert. Only the reason and, for Resend errors, the HTTP status code.
// Never pass the recipient, sender, API key, or provider message here.
function logAlertSkipped(reason: AlertSkipLogReason, statusCode?: number | null) {
  console.warn("reconciliation_alert_skipped", reason === "resend_error" ? { reason, status: statusCode ?? null } : { reason });
}

function providerStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const code = (error as { statusCode?: unknown }).statusCode;
  return typeof code === "number" && Number.isInteger(code) ? code : null;
}

// The alert label is the same one /api/version reports (PASSAGE_ENVIRONMENT, then
// PASSAGE_ENVIRONMENT_GROK, then VERCEL_ENV), so Production reads "production" even
// though that project has no PASSAGE_ENVIRONMENT.
export function reconciliationAlertEnvironmentLabel(env: Record<string, string | undefined>) {
  return readReleaseProvenance(env).environment ?? "unknown";
}

function normalizeAddress(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

// The configured AUTHORITY_OPS_ALERT_EMAIL is an internal Ops inbox set by Ops, not a
// participant, so it skips the Demo recipient allowlist. Only that exact configured value
// is exempt, and only on this alert path. Any other recipient still gets the Demo check.
export function isOpsAlertRecipientAllowed(recipient: string, env: Record<string, string | undefined>) {
  const configured = normalizeAddress(env.AUTHORITY_OPS_ALERT_EMAIL);
  if (configured && normalizeAddress(recipient) === configured) return true;
  return isDemoEmailRecipientAllowed(recipient, env.PASSAGE_ENVIRONMENT, env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST);
}

const sendWithResend: AlertSender = async (apiKey, email, idempotencyKey) =>
  new Resend(apiKey).emails.send(email, { headers: { "Idempotency-Key": idempotencyKey } });

export function buildReconciliationAlertEmail(summary: ReconciliationAlertSummary, environmentLabel: string | null | undefined, options: { test?: boolean } = {}) {
  const envLabel = environmentLabel?.trim() || "unknown";
  const runDate = summary.runDate ?? "not recorded";
  const subject = `Passage Authority (${envLabel}): daily reconciliation is ${summary.status}`;
  const body = [
    "The daily reconciliation check did not come back clean.",
    "",
    `Environment: ${envLabel}`,
    `Status: ${summary.status}`,
    `Run date: ${runDate}`,
    "",
    "Check authority_private.reconciliation_runs in Supabase for the details.",
    "This email is only sent when the result is not clean.",
  ];
  if (!options.test) return { subject, text: body.join("\n") };
  return {
    subject: `[TEST] ${subject}`,
    text: [
      "This is a test. Nothing is wrong.",
      "Someone on the team asked Passage to send this email to check that alerts arrive.",
      "No check was run and no data was changed.",
      "",
      "Below is what a real alert looks like:",
      "",
      ...body,
    ].join("\n"),
  };
}

// Sends one plain alert email. Never throws: a failed or skipped alert must not change the cron response.
export async function sendReconciliationAlert(
  summary: ReconciliationAlertSummary,
  env: Record<string, string | undefined> = process.env,
  send: AlertSender = sendWithResend,
  options: { test?: boolean; idempotencyKey?: string } = {},
): Promise<ReconciliationAlertResult> {
  try {
    const to = env.AUTHORITY_OPS_ALERT_EMAIL?.trim();
    const from = env.AUTHORITY_EMAIL_FROM?.trim();
    const apiKey = env.RESEND_API_KEY?.trim();
    if (!to) {
      logAlertSkipped("no_address");
      return { sent: false, reason: "not_configured" };
    }
    if (!from || !apiKey) {
      logAlertSkipped("not_configured");
      return { sent: false, reason: "not_configured" };
    }
    if (!isOpsAlertRecipientAllowed(to, env)) {
      logAlertSkipped("allowlist_blocked");
      return { sent: false, reason: "recipient_not_allowed" };
    }
    const message = buildReconciliationAlertEmail(summary, reconciliationAlertEnvironmentLabel(env), { test: options.test });
    const day = summary.runDate ?? new Date().toISOString().slice(0, 10);
    const key = options.idempotencyKey ?? `authority-reconciliation-alert-${day}-${summary.status}`;
    const response = await send(apiKey, { from, to, ...message }, key);
    if (response?.error) {
      logAlertSkipped("resend_error", providerStatusCode(response.error));
      return { sent: false, reason: "provider_rejected" };
    }
    return { sent: true };
  } catch {
    logAlertSkipped("resend_error", null);
    return { sent: false, reason: "provider_rejected" };
  }
}

// Optional AUTHORITY_OPS_ALERT_SELFTEST_DATE (UTC YYYY-MM-DD). When the daily cron runs on
// that UTC date, it sends one extra "[TEST]" alert after the normal run. Unset, malformed,
// or any other date does nothing. Writes no data. The per-date idempotency key stops a
// second cron call on the same day from sending twice.
export function parseSelfTestDate(value: string | undefined): string | null {
  const raw = value?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : null;
}

export type SelfTestOutcome = { attempted: false } | { attempted: true; result: ReconciliationAlertResult };

export async function maybeSendSelfTestAlert(
  env: Record<string, string | undefined> = process.env,
  send: AlertSender = sendWithResend,
  now: () => Date = () => new Date(),
): Promise<SelfTestOutcome> {
  const date = parseSelfTestDate(env.AUTHORITY_OPS_ALERT_SELFTEST_DATE);
  if (!date || now().toISOString().slice(0, 10) !== date) return { attempted: false };
  const result = await sendReconciliationAlert({ status: "test", runDate: date }, env, send, {
    test: true,
    idempotencyKey: `authority-reconciliation-alert-selftest-${date}`,
  });
  return { attempted: true, result };
}

type AlertFn = (summary: ReconciliationAlertSummary) => Promise<unknown>;

async function alertSafely(alert: AlertFn, summary: ReconciliationAlertSummary) {
  try {
    await alert(summary);
  } catch {
    // Alerting must never change the cron HTTP contract.
  }
}

async function selfTestSafely(selfTest: () => Promise<unknown>) {
  try {
    await selfTest();
  } catch {
    // The self-test email must never change the cron HTTP contract.
  }
}

export async function dailyReconciliationResponse(
  request: Request,
  configuredSecret: string | undefined,
  run: () => Promise<unknown>,
  alert: AlertFn = (summary) => sendReconciliationAlert(summary),
  selfTest: () => Promise<unknown> = () => maybeSendSelfTestAlert(),
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
    await selfTestSafely(selfTest);
    return Response.json({ok:false}, {status:503,headers});
  }
  const row = result as Record<string, unknown>;
  const clean = row.status === "clean";
  if (!clean) await alertSafely(alert, { status: String(row.status), runDate: row.run_date == null ? null : String(row.run_date) });
  await selfTestSafely(selfTest);
  return Response.json({ok:clean,status:row.status,run_date:row.run_date,already_recorded_today:row.already_recorded_today===true}, {status:clean?200:409,headers});
}

export type OpsAlertTestResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "not_configured" | "recipient_not_allowed" | "provider_rejected" };

type TestAlertFn = (summary: ReconciliationAlertSummary, idempotencyKey: string) => Promise<ReconciliationAlertResult>;

// One-shot Ops check that the reconciliation alert email arrives. It uses the same
// CRON_SECRET bearer check as the cron routes and the same send path as the real
// alert (same recipient, sender, and recipient check), with a "[TEST]" subject.
// It runs no reconciliation, reads and writes no data, and returns only the outcome.
export async function opsAlertTestResponse(
  request: Request,
  configuredSecret: string | undefined,
  alert: TestAlertFn = (summary, idempotencyKey) => sendReconciliationAlert(summary, process.env, sendWithResend, { test: true, idempotencyKey }),
  now: () => Date = () => new Date(),
) {
  const headers = { "Cache-Control": "private, no-store" };
  const secret = Buffer.from(configuredSecret?.trim() ?? "");
  const supplied = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (!secret.length || secret.length !== supplied.length || !timingSafeEqual(secret, supplied)) {
    return Response.json({ status: "unauthorized" }, { status: 401, headers });
  }
  const at = now().toISOString();
  // One send per minute at most, so a double click or retry does not send twice.
  const idempotencyKey = `authority-reconciliation-alert-test-${at.slice(0, 16)}`;
  let result: ReconciliationAlertResult;
  try {
    result = await alert({ status: "test", runDate: at.slice(0, 10) }, idempotencyKey);
  } catch {
    result = { sent: false, reason: "provider_rejected" };
  }
  const body: OpsAlertTestResult = result.sent ? { status: "sent" } : { status: "skipped", reason: result.reason };
  return Response.json(body, { status: 200, headers });
}
