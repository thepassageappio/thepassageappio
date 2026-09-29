import {test} from "node:test";
import assert from "node:assert/strict";
import {opsAlertTestResponse,sendReconciliationAlert} from "./daily-reconciliation.ts";

type Sent={apiKey:string;email:{from:string;to:string;subject:string;text:string};key:string};
const post=(token?:string)=>new Request("https://example.test/api/internal/ops-alert-test",{method:"POST",headers:token===undefined?{}:{authorization:`Bearer ${token}`}});
const env={AUTHORITY_OPS_ALERT_EMAIL:"ops@example.invalid",AUTHORITY_EMAIL_FROM:"Passage Authority <noreply@example.invalid>",RESEND_API_KEY:"re_test_key",PASSAGE_ENVIRONMENT:"production"};
const fixedNow=()=>new Date("2026-09-29T15:04:05.000Z");
function alertWith(candidateEnv:Record<string,string|undefined>,calls:Sent[]){
  return (summary:{status:string;runDate:string|null},idempotencyKey:string)=>sendReconciliationAlert(summary,candidateEnv,async(apiKey,email,key)=>{calls.push({apiKey,email,key});return {error:null};},{test:true,idempotencyKey});
}

test("ops alert test returns 401 and sends nothing without the right secret",async()=>{
  for(const [token,secret] of [[undefined,"correct"],["wrong","correct"],["",""],["anything",undefined]] as const){
    const calls:Sent[]=[];
    const result=await opsAlertTestResponse(post(token),secret,alertWith(env,calls),fixedNow);
    assert.equal(result.status,401);
    assert.deepEqual(await result.json(),{status:"unauthorized"});
    assert.equal(calls.length,0);
  }
});

test("ops alert test sends one [TEST] alert through the real alert path with the secret",async()=>{
  const calls:Sent[]=[];
  const result=await opsAlertTestResponse(post("correct"),"correct",alertWith(env,calls),fixedNow);
  assert.equal(result.status,200);
  assert.equal(result.headers.get("cache-control"),"private, no-store");
  assert.deepEqual(await result.json(),{status:"sent"});
  assert.equal(calls.length,1);
  assert.equal(calls[0].email.to,"ops@example.invalid");
  assert.match(calls[0].email.subject,/^\[TEST\] Passage Authority \(production\)/);
  assert.match(calls[0].email.text,/^This is a test\. Nothing is wrong\./);
  assert.equal(calls[0].key,"authority-reconciliation-alert-test-2026-09-29T15:04");
  assert.doesNotMatch(JSON.stringify(calls[0].email),/re_test_key|—/);
});

test("ops alert test is skipped when AUTHORITY_OPS_ALERT_EMAIL is unset",async()=>{
  const calls:Sent[]=[];
  const {AUTHORITY_OPS_ALERT_EMAIL:_unused,...unset}=env;void _unused;
  const result=await opsAlertTestResponse(post("correct"),"correct",alertWith(unset,calls),fixedNow);
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{status:"skipped",reason:"not_configured"});
  assert.equal(calls.length,0);
});

test("ops alert test on Demo reaches the configured ops address even when the allowlist omits it",async()=>{
  const calls:Sent[]=[];
  const demo={...env,PASSAGE_ENVIRONMENT:"demo",PASSAGE_EMAIL_RECIPIENT_ALLOWLIST:"someone-else@example.invalid"};
  const result=await opsAlertTestResponse(post("correct"),"correct",alertWith(demo,calls),fixedNow);
  assert.deepEqual(await result.json(),{status:"sent"});
  assert.equal(calls.length,1);
  assert.equal(calls[0].email.to,"ops@example.invalid");
  assert.match(calls[0].email.subject,/^\[TEST\] Passage Authority \(demo\)/);
});

test("ops alert test never throws and never echoes the recipient or key",async()=>{
  const result=await opsAlertTestResponse(post("correct"),"correct",async()=>{throw new Error("ops@example.invalid re_test_key");},fixedNow);
  assert.equal(result.status,200);
  const text=JSON.stringify(await result.json());
  assert.equal(text,JSON.stringify({status:"skipped",reason:"provider_rejected"}));
});
