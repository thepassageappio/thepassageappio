import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url='http://127.0.0.1:55321';
const publicKey=process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY;
const localKey=process.env.LOCAL_SUPABASE_SECRET_KEY;
assert.ok(publicKey && localKey, 'Supply local Supabase keys; this verifier only connects to loopback.');
const admin=createClient(url,localKey,{auth:{persistSession:false,autoRefreshToken:false}});
const org=randomUUID(), users=[], cookies=new Map();
const sql=q=>execFileSync('docker',['exec','-i','supabase_db_passage-authority','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8'});
function totp(secret){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits='';
 for(const c of secret.replace(/=/g,''))bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');
 const key=Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2)));
 const step=Buffer.alloc(8);step.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const digest=createHmac('sha1',key).update(step).digest(),offset=digest[19]&15;
 return ((digest.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
let browser;
try{
 for(let i=0;i<3;i++){
  const email='mfa-browser-'+randomUUID()+'@local.authority.test',password=randomUUID()+'aA1!';
  const made=await admin.auth.admin.createUser({email,password,email_confirm:true});if(made.error)throw made.error;
  const id=made.data.user.id;users.push(id);
  const client=i===0?createServerClient(url,publicKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(r=>cookies.set(r.name,r.value))}}):createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const signed=await client.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;
  for(let j=0;j<2-i;j++){
   const enrolled=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Local test '+j});if(enrolled.error)throw enrolled.error;
   const checked=await client.auth.mfa.challengeAndVerify({factorId:enrolled.data.id,code:totp(enrolled.data.totp.secret)});if(checked.error)throw checked.error;
  }
 }
 sql("insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status) values('"+org+"','Local MFA Browser','Local MFA Browser','regional_bank','1 Test Way','Albany','NY','12207','"+users[0]+"','ready');"+
 users.map((id,i)=>"insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role) select '"+org+"',id,email,'Synthetic "+['Owner','Administrator','Unenrolled'][i]+"','"+(i===0?'owner':'admin')+"' from auth.users where id='"+id+"';").join(''));
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:1000}});
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:'127.0.0.1',path:'/',httpOnly:false,sameSite:'Lax'})));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3100/app/security');
 await page.getByRole('heading',{name:'Team authenticator enrollment'}).waitFor();
 const team=page.getByRole('region',{name:'Team authenticator enrollment'});
 assert.equal(await team.locator('li').count(),3);
 for(const label of ['Enrollment needed','Backup authenticator needed','Backup authenticator enrolled'])assert.equal(await team.getByText(label,{exact:true}).count(),1);
 await page.screenshot({path:'work/mfa-team-desktop.png',fullPage:true});
 for(const width of [390,360]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'document overflow');
  const box=await page.getByRole('button',{name:'Refresh status'}).boundingBox();assert.ok(box.height>=44);
  await page.screenshot({path:'work/mfa-team-'+width+'.png',fullPage:true});
 }
 await page.getByRole('button',{name:'Refresh status'}).focus();
 await Promise.all([page.waitForNavigation(),page.keyboard.press('Enter')]);
 await page.getByRole('heading',{name:'Team authenticator enrollment'}).waitFor();
 assert.equal(await team.locator('li').count(),3);
 sql('revoke execute on function public.get_privileged_mfa_status_v1(uuid) from authenticated;');
 await page.reload();
 assert.match(await team.innerText(),/Team status is unavailable/);
 assert.equal(await team.locator('li').count(),0);
 sql('grant execute on function public.get_privileged_mfa_status_v1(uuid) to authenticated;');
 await page.getByRole('button',{name:'Refresh status'}).click();
 await page.getByText('Backup authenticator enrolled',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,checks:['real local password plus TOTP AAL2','three live enrollment counts','1280/390/360 rendering','44px refresh and keyboard GET','RPC denial unavailable and refresh recovery','zero page errors']}));
}finally{
 sql('grant execute on function public.get_privileged_mfa_status_v1(uuid) to authenticated;');
 if(browser)await browser.close();
 sql("delete from public.organization_entitlements where organization_id='"+org+"'; delete from public.organizations where id='"+org+"';");
 for(const id of users){const result=await admin.auth.admin.deleteUser(id);if(result.error)throw result.error;}
 console.log('Synthetic browser fixtures removed.');
}
