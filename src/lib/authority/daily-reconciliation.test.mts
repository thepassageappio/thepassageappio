import {test} from "node:test";
import assert from "node:assert/strict";
import {dailyReconciliationResponse,isOpsAlertRecipientAllowed,maybeSendSelfTestAlert,parseSelfTestDate,reconciliationAlertEnvironmentLabel,sendReconciliationAlert} from "./daily-reconciliation.ts";
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

const alertEnv = {AUTHORITY_OPS_ALERT_EMAIL:"ops@example.invalid",AUTHORITY_EMAIL_FROM:"Passage Authority <noreply@example.invalid>",RESEND_API_KEY:"re_test_key",PASSAGE_ENVIRONMENT:"production"};
test("clean runs send no alert; non-clean and failed runs alert without changing the response",async()=>{
  const alerts:unknown[]=[];const alert=async(summary:unknown)=>{alerts.push(summary);};
  assert.equal((await dailyReconciliationResponse(request("correct"),"correct",async()=>({status:"clean",run_date:"2026-09-22"}),alert)).status,200);
  assert.equal(alerts.length,0);
  assert.equal((await dailyReconciliationResponse(request("correct"),"correct",async()=>({status:"variance",run_date:"2026-09-22"}),alert)).status,409);
  assert.equal((await dailyReconciliationResponse(request("correct"),"correct",async()=>{throw new Error("private detail");},alert)).status,503);
  assert.deepEqual(alerts,[{status:"variance",runDate:"2026-09-22"},{status:"error",runDate:null}]);
  assert.equal((await dailyReconciliationResponse(request("wrong"),"correct",async()=>({status:"variance",run_date:"2026-09-22"}),alert)).status,404);
  assert.equal(alerts.length,2);
});
test("a throwing alert never breaks the cron response",async()=>{
  const alert=async()=>{throw new Error("boom");};
  const result=await dailyReconciliationResponse(request("correct"),"correct",async()=>({status:"blocked",run_date:"2026-09-22"}),alert);
  assert.equal(result.status,409);assert.deepEqual(await result.json(),{ok:false,status:"blocked",run_date:"2026-09-22",already_recorded_today:false});
});
test("alert is sent to the configured address with plain copy and a per-day idempotency key",async()=>{
  const calls:{apiKey:string;email:{from:string;to:string;subject:string;text:string};key:string}[]=[];
  const outcome=await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},alertEnv,async(apiKey,email,key)=>{calls.push({apiKey,email,key});return {error:null};});
  assert.deepEqual(outcome,{sent:true});assert.equal(calls.length,1);
  assert.equal(calls[0].apiKey,"re_test_key");assert.equal(calls[0].email.to,"ops@example.invalid");assert.equal(calls[0].email.from,alertEnv.AUTHORITY_EMAIL_FROM);
  assert.equal(calls[0].key,"authority-reconciliation-alert-2026-09-22-variance");
  assert.match(calls[0].email.subject,/daily reconciliation is variance/);
  assert.match(calls[0].email.text,/Status: variance/);assert.match(calls[0].email.text,/Run date: 2026-09-22/);
  assert.doesNotMatch(calls[0].email.text,/re_test_key/);
});
test("alert is skipped cleanly when AUTHORITY_OPS_ALERT_EMAIL is unset",async()=>{
  let called=false;
  const {AUTHORITY_OPS_ALERT_EMAIL:_unused,...env}=alertEnv;void _unused;
  for(const candidate of [env,{...env,AUTHORITY_OPS_ALERT_EMAIL:"  "}]){
    assert.deepEqual(await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},candidate,async()=>{called=true;return {error:null};}),{sent:false,reason:"not_configured"});
  }
  assert.equal(called,false);
});
test("the configured ops address skips the Demo allowlist on the alert path only",async()=>{
  const calls:string[]=[];
  const env={...alertEnv,PASSAGE_ENVIRONMENT:"demo",PASSAGE_EMAIL_RECIPIENT_ALLOWLIST:"someone-else@example.invalid"};
  assert.deepEqual(await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},env,async(_k,email)=>{calls.push(email.to);return {error:null};}),{sent:true});
  assert.deepEqual(calls,["ops@example.invalid"]);
  assert.equal(isOpsAlertRecipientAllowed(" OPS@example.invalid ",env),true);
  assert.equal(isOpsAlertRecipientAllowed("other@example.invalid",env),false,"any other recipient still gets the Demo check");
  assert.equal(isOpsAlertRecipientAllowed("someone-else@example.invalid",env),true);
  assert.equal(isOpsAlertRecipientAllowed("other@example.invalid",{...env,AUTHORITY_OPS_ALERT_EMAIL:""}),false);
});
test("alert subjects use the same environment label as /api/version",async()=>{
  assert.equal(reconciliationAlertEnvironmentLabel({VERCEL_ENV:"production"}),"production");
  assert.equal(reconciliationAlertEnvironmentLabel({PASSAGE_ENVIRONMENT:"demo",VERCEL_ENV:"production"}),"demo");
  assert.equal(reconciliationAlertEnvironmentLabel({PASSAGE_ENVIRONMENT_GROK:"demo",VERCEL_ENV:"production"}),"demo");
  assert.equal(reconciliationAlertEnvironmentLabel({PASSAGE_ENVIRONMENT:"nonsense"}),"unknown");
  const subjects:string[]=[];
  const {PASSAGE_ENVIRONMENT:_p,...prodLike}=alertEnv;void _p;
  await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},{...prodLike,VERCEL_ENV:"production"},async(_k,email)=>{subjects.push(email.subject);return {error:null};});
  assert.deepEqual(subjects,["Passage Authority (production): daily reconciliation is variance"]);
});
test("a skipped alert logs one line with only the reason and status code",async()=>{
  const logged:unknown[][]=[];const original=console.warn;console.warn=(...args:unknown[])=>{logged.push(args);};
  try{
    const {AUTHORITY_OPS_ALERT_EMAIL:_a,...noAddress}=alertEnv;void _a;
    await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},noAddress,async()=>({error:null}));
    await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},{...alertEnv,RESEND_API_KEY:""},async()=>({error:null}));
    await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},alertEnv,async()=>({error:{message:"ops@example.invalid rejected",statusCode:422,name:"validation_error"}}));
    await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},alertEnv,async()=>{throw new Error("re_test_key");});
    await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},alertEnv,async()=>({error:null}));
  }finally{console.warn=original;}
  assert.deepEqual(logged,[
    ["reconciliation_alert_skipped",{reason:"no_address"}],
    ["reconciliation_alert_skipped",{reason:"not_configured"}],
    ["reconciliation_alert_skipped",{reason:"resend_error",status:422}],
    ["reconciliation_alert_skipped",{reason:"resend_error",status:null}],
  ]);
  assert.doesNotMatch(JSON.stringify(logged),/ops@example\.invalid|re_test_key|noreply/);
});
test("self-test date must be a real UTC YYYY-MM-DD",()=>{
  assert.equal(parseSelfTestDate("2026-09-29"),"2026-09-29");
  assert.equal(parseSelfTestDate(" 2026-09-29 "),"2026-09-29");
  for(const bad of [undefined,"","2026-9-29","2026-02-30","29/09/2026","2026-09-29T00:00:00Z","tomorrow"]) assert.equal(parseSelfTestDate(bad),null,String(bad));
});
test("self-test sends one [TEST] alert only on the matching UTC date",async()=>{
  const calls:{subject:string;key:string}[]=[];
  const send=async(_k:string,email:{subject:string},key:string)=>{calls.push({subject:email.subject,key});return {error:null};};
  const at=(iso:string)=>()=>new Date(iso);
  const env={...alertEnv,AUTHORITY_OPS_ALERT_SELFTEST_DATE:"2026-09-29"};
  assert.deepEqual(await maybeSendSelfTestAlert(env,send,at("2026-09-29T08:00:00Z")),{attempted:true,result:{sent:true}});
  assert.equal(calls.length,1);
  assert.match(calls[0].subject,/^\[TEST\] Passage Authority \(production\)/);
  assert.equal(calls[0].key,"authority-reconciliation-alert-selftest-2026-09-29");
  assert.deepEqual(await maybeSendSelfTestAlert(env,send,at("2026-09-28T23:59:59Z")),{attempted:false},"non-matching date");
  assert.deepEqual(await maybeSendSelfTestAlert({...env,AUTHORITY_OPS_ALERT_SELFTEST_DATE:"2026-9-29"},send,at("2026-09-29T08:00:00Z")),{attempted:false},"malformed");
  assert.deepEqual(await maybeSendSelfTestAlert(alertEnv,send,at("2026-09-29T08:00:00Z")),{attempted:false},"unset");
  assert.equal(calls.length,1);
});
test("the cron runs the normal check, then the self-test, without changing the response",async()=>{
  const order:string[]=[];
  const run=async()=>{order.push("run");return {status:"clean",run_date:"2026-09-29"};};
  const result=await dailyReconciliationResponse(request("correct"),"correct",run,async()=>{order.push("alert");},async()=>{order.push("selftest");});
  assert.equal(result.status,200);assert.deepEqual(order,["run","selftest"]);
  const failing=await dailyReconciliationResponse(request("correct"),"correct",async()=>{throw new Error("x");},async()=>{},async()=>{throw new Error("boom");});
  assert.equal(failing.status,503);
  let called=false;
  assert.equal((await dailyReconciliationResponse(request("wrong"),"correct",run,async()=>{},async()=>{called=true;})).status,404);
  assert.equal(called,false);
});
test("send failures return a result and never throw or log the recipient or key",async()=>{
  const logged:unknown[]=[];const original=console.error;console.error=(...args:unknown[])=>{logged.push(args);};
  try{
    assert.deepEqual(await sendReconciliationAlert({status:"error",runDate:null},alertEnv,async()=>{throw new Error("network down");}),{sent:false,reason:"provider_rejected"});
    assert.deepEqual(await sendReconciliationAlert({status:"variance",runDate:"2026-09-22"},alertEnv,async()=>({error:{message:"rejected"}})),{sent:false,reason:"provider_rejected"});
  }finally{console.error=original;}
  const text=JSON.stringify(logged);
  assert.doesNotMatch(text,/ops@example\.invalid|re_test_key/);
});
