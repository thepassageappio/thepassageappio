import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url='http://127.0.0.1:55321', publicKey=process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY, localKey=process.env.LOCAL_SUPABASE_SECRET_KEY;
assert.ok(publicKey && localKey);
const admin=createClient(url,localKey,{auth:{persistSession:false,autoRefreshToken:false}});
const org=randomUUID(),users=[],jars=[],roles=['owner','reviewer'];
const sql=q=>execFileSync('docker',['exec','-i','supabase_db_passage-authority','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8'});
function totp(secret){
 let bits='';for(const c of secret.replace(/=/g,''))bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5,'0');
 const key=Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2))),step=Buffer.alloc(8);
 step.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const digest=createHmac('sha1',key).update(step).digest(),offset=digest[19]&15;
 return ((digest.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
let browser;
try {
 for(const role of roles){
  const email='workspace-'+role+'-'+randomUUID()+'@local.authority.test',password=randomUUID()+'aA1!',cookies=new Map();
  const made=await admin.auth.admin.createUser({email,password,email_confirm:true});if(made.error)throw made.error;users.push(made.data.user.id);jars.push(cookies);
  const client=createServerClient(url,publicKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(r=>cookies.set(r.name,r.value))}});
  const signed=await client.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;
  const enrolled=await client.auth.mfa.enroll({factorType:'totp'});if(enrolled.error)throw enrolled.error;
  const checked=await client.auth.mfa.challengeAndVerify({factorId:enrolled.data.id,code:totp(enrolled.data.totp.secret)});if(checked.error)throw checked.error;
 }
 sql("insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status) values('"+org+"','Sample Community Bank','Sample Community Bank','regional_bank','1 Test Way','Albany','NY','12207','"+users[0]+"','ready');"+users.map((id,i)=>"insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role) select '"+org+"',id,email,'Synthetic "+roles[i]+"','"+roles[i]+"' from auth.users where id='"+id+"';").join(''));

 sql("insert into public.organization_template_selections(organization_id,template_key,template_version,selected_by) values('"+org+"','ny_financial_poa','2026.1','"+users[0]+"');");
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:1000}});
 await context.addCookies([...jars[0]].map(([name,value])=>({name,value,domain:'127.0.0.1',path:'/',httpOnly:false,sameSite:'Lax'})));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3100/app/requests/new?sample=1');
 await page.getByRole('heading',{name:'Who needs help, and with which account?'}).waitFor();
 await page.locator('[name=principalEmail]').fill('same@local.authority.test');
 await page.locator('[name=representativeEmail]').fill('same@local.authority.test');
 await page.locator('[name=accountBoundary]').fill('Sample account ending 7788');
 await page.locator('[value=discuss_service_issues]').uncheck();
 await page.locator('[name=principalName]').fill('Saved Person');
 const key=await page.locator('[name=idempotencyKey]').inputValue();
 await page.getByRole('button',{name:'Save draft'}).focus();await page.keyboard.press('Enter');
 await page.getByText('Use different email addresses for the account holder and the representative.').waitFor();
 assert.equal(await page.locator('[name=accountBoundary]').inputValue(),'Sample account ending 7788');
 assert.equal(await page.locator('[name=principalEmail]').inputValue(),'same@local.authority.test');
 assert.equal(await page.locator('[value=discuss_service_issues]').isChecked(),false);
 assert.equal(await page.locator('[name=idempotencyKey]').inputValue(),key);
 assert.ok(await page.locator('[role=alert]').filter({hasText:'Check your request'}).evaluate(e=>e===document.activeElement));
 for(const width of [1280,390,360]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'work/draft-recovery-'+width+'.png',fullPage:true});}
 await page.locator('[name=representativeEmail]').fill('other@local.authority.test');
 await page.locator('[name=validUntil]').fill('2040-01-01');
 await page.getByRole('button',{name:'Save draft'}).click();
 await page.getByText('Choose a valid future end date.').waitFor();
 assert.equal(await page.locator('[name=validUntil]').inputValue(),'2040-01-01');
 assert.equal(await page.locator('[name=representativeEmail]').inputValue(),'other@local.authority.test');
 assert.match(sql("select count(*) from public.authority_records where organization_id='"+org+"';"),/\b0\b/);
 const date=new Date();date.setFullYear(date.getFullYear()+1);await page.locator('[name=validUntil]').fill(date.toISOString().slice(0,10));
 let post;page.on('request',request=>{if(request.method()==='POST'&&request.headers()['next-action'])post=request;});
 await page.getByRole('button',{name:'Save draft'}).click();
 await page.waitForURL(/\/app\/requests\/[a-f0-9-]+\?notice=draft_created/);
 assert.ok(post);const headers={};for(const name of ['next-action','content-type','accept','next-router-state-tree'])if(post.headers()[name])headers[name]=post.headers()[name];
 await context.request.post(post.url(),{headers,data:post.postDataBuffer()});
 const count=()=>sql("select count(*) from public.authority_records where organization_id='"+org+"';");assert.match(count(),/\b1\b/);
 assert.match(sql("select count(*) from public.authority_events where organization_id='"+org+"';"),/\b1\b/);
 assert.match(sql("select activated_count from public.organization_entitlements where organization_id='"+org+"';"),/\b0\b/);
 const reviewer=await browser.newContext();await reviewer.addCookies([...jars[1]].map(([name,value])=>({name,value,domain:'127.0.0.1',path:'/',httpOnly:false,sameSite:'Lax'})));
 const denied=await reviewer.request.post(post.url(),{headers,data:post.postDataBuffer()});assert.match(await denied.text(),/Only an owner/);assert.match(count(),/\b1\b/);
 const reviewPage=await reviewer.newPage();await reviewPage.goto(page.url());await reviewPage.getByText('Sample account ending 7788',{exact:true}).first().waitFor();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,organization:org,request:page.url(),checks:['server validation keeps entries and checkbox choices','database rejection keeps values','keyboard error focus','1280/390/360','corrected save and saved event','exact POST replay creates no duplicate','reviewer cannot create but sees saved draft','draft uses no allowance']}));
}finally{
 if(browser)await browser.close();
 // Retain the local append-only draft and event for replay. Close access instead of deleting history.
 sql("update public.organizations set status='closed' where id='"+org+"';");
 for(const id of users){const result=await admin.auth.admin.updateUserById(id,{ban_duration:'876000h'});if(result.error)throw result.error;}
 console.log('Local replay fixture retained; organization closed and fixture accounts banned.');
}
