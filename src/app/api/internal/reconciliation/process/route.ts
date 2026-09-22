import { createAuthorityAdminClient } from "@/lib/supabase/admin";
import { dailyReconciliationResponse } from "@/lib/authority/daily-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  return dailyReconciliationResponse(request, process.env.CRON_SECRET, async () => {
    const {data,error} = await createAuthorityAdminClient().rpc("run_daily_reconciliation_v1");
    if (error) throw error;
    return data;
  });
}
