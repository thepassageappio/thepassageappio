import { opsAlertTestResponse } from "@/lib/authority/daily-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST only: sends one "[TEST]" reconciliation alert. Guarded by CRON_SECRET like the cron routes.
export async function POST(request: Request) {
  return opsAlertTestResponse(request, process.env.CRON_SECRET);
}
