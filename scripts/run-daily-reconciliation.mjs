import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Runs the daily reconciliation job (see supabase/migrations/20260907153000_daily_reconciliation_check.sql)
// against one Supabase project and writes the result as evidence. Mirrors the
// SUPABASE_URL / SUPABASE_SECRET_KEY / SUPABASE_ENVIRONMENT_LABEL convention
// already used by scripts/verify-gate1-database.mjs.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... SUPABASE_ENVIRONMENT_LABEL=uat \
//     node scripts/run-daily-reconciliation.mjs
//
// Exit code is 0 only when the day is "clean". A non-zero exit on a
// "blocked"/"variance" day is intentional: a broken day resets the P2
// seven-consecutive-clean-day streak in docs/RECONCILIATION-LOG.md, and CI
// (see .github/workflows/daily-reconciliation.yml) should visibly fail so
// that reset doesn't go unnoticed.

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const environmentLabel = process.env.SUPABASE_ENVIRONMENT_LABEL ?? "supabase";

if (!url || !secretKey) {
  console.error("SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  process.exit(2);
}

const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await admin.rpc("run_daily_reconciliation_v1");

if (error) {
  console.error(`Reconciliation call failed for ${environmentLabel}:`, error.message);
  process.exit(2);
}

const evidenceDirectory = path.join(process.cwd(), "work", "evidence", "reconciliation");
await mkdir(evidenceDirectory, { recursive: true });
const safeLabel = environmentLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const fileName = `${data.run_date}-${safeLabel}.json`;
await writeFile(path.join(evidenceDirectory, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");

const summary = {
  environment: environmentLabel,
  run_date: data.run_date,
  status: data.status,
  run_key: data.run_key,
  already_recorded_today: data.already_recorded_today,
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (data.status !== "clean") {
  console.error(
    `Reconciliation status for ${environmentLabel} on ${data.run_date}: ${data.status.toUpperCase()}. ` +
      `See ${fileName} for details and update docs/RECONCILIATION-LOG.md.`,
  );
  process.exit(1);
}
