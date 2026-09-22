import {test} from "node:test";
import assert from "node:assert/strict";
import {dailyReconciliationResponse} from "./daily-reconciliation.ts";
const request = (token:string) => new Request("https://example.test",{headers:{authorization:`Bearer ${token}`}});
test("daily evidence rejects missing or incorrect credentials before running",async()=>{
  for(const secret of [undefined,"correct"]){let called=false;const result=await dailyReconciliationResponse(request("wrong"),secret,async()=>{called=true;});assert.equal(result.status,404);assert.equal(called,false);}
});
test("daily evidence emits only a sanitized summary and respects recorded-day replay",async()=>{
  const result=await dailyReconciliationResponse(request("correct"),"correct",async()=>({status:"clean",run_date:"2026-09-22",already_recorded_today:true,billing_snapshot:{private:"hidden"}}));
  assert.equal(result.status,200);assert.deepEqual(await result.json(),{ok:true,status:"clean",run_date:"2026-09-22",already_recorded_today:true});
});
test("variance and failed daily runs cannot appear successful",async()=>{
  assert.equal((await dailyReconciliationResponse(request("correct"),"correct",async()=>({status:"variance",run_date:"2026-09-22"}))).status,409);
  assert.equal((await dailyReconciliationResponse(request("correct"),"correct",async()=>{throw new Error("private detail");})).status,503);
});
