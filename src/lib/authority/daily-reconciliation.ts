import { timingSafeEqual } from "node:crypto";

export async function dailyReconciliationResponse(request: Request, configuredSecret: string | undefined, run: () => Promise<unknown>) {
  const secret = Buffer.from(configuredSecret?.trim() ?? "");
  const supplied = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const headers = { "Cache-Control": "private, no-store" };
  if (!secret.length || secret.length !== supplied.length || !timingSafeEqual(secret, supplied)) return Response.json({ok:false}, {status:404,headers});
  try {
    const result = await run();
    if (!result || typeof result !== "object" || !("status" in result) || !("run_date" in result)) throw new Error("invalid_result");
    const row = result as Record<string, unknown>;
    const clean = row.status === "clean";
    return Response.json({ok:clean,status:row.status,run_date:row.run_date,already_recorded_today:row.already_recorded_today===true}, {status:clean?200:409,headers});
  } catch { return Response.json({ok:false}, {status:503,headers}); }
}
