// Dedicated synthetic accounts only. Credentials/tokens remain in ignored tmp/.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync('frontend/js/supabase-config.js','utf8');
const {url,key}=vm.runInNewContext(source.replace(/const supabaseClient[\s\S]*/, '')+';({url:SUPABASE_URL,key:SUPABASE_ANON_KEY})');
const secretFile='tmp/live-auth-fixtures.json';
async function request(path,method='GET',body,token=key){
  const r=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return{status:r.status,data};
}
(async()=>{
  const phase=process.argv[2];fs.mkdirSync('tmp',{recursive:true});
  if(phase==='prepare'){
    const accounts=['student','admin'].map(role=>({role,id:crypto.randomUUID(),email:`internmatch-test-${crypto.randomUUID()}@example.invalid`,password:crypto.randomBytes(24).toString('base64url')}));
    fs.writeFileSync(secretFile,JSON.stringify(accounts));
    const quote=s=>"'"+s.replaceAll("'","''")+"'";
    const setup=accounts.map(a=>`insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
values(${quote(a.id)},'00000000-0000-0000-0000-000000000000','authenticated','authenticated',${quote(a.email)},extensions.crypt(${quote(a.password)},extensions.gen_salt('bf')),now(),'\{"provider":"email","providers":["email"],"internmatch_test":true\}','\{"full_name":"InternMatch synthetic API test","role":"Student"\}',now(),now(),'','','','');
insert into auth.identities(provider_id,user_id,identity_data,provider,created_at,updated_at) values(${quote(a.id)},${quote(a.id)},jsonb_build_object('sub',${quote(a.id)},'email',${quote(a.email)},'email_verified',true),'email',now(),now());
${a.role==='admin'?`update public.users set role='Admin' where id=${quote(a.id)};`:''}`).join('\n');
    fs.writeFileSync('tmp/live-fixture-setup.sql','begin;\n'+setup+'\ncommit;\n');
    fs.writeFileSync('tmp/live-fixture-reset.sql',`update public.users set account_status='Active' where id=${quote(accounts[0].id)};\n`);
    const conditions=accounts.map(a=>`(id=${quote(a.id)} and email=${quote(a.email)})`).join(' or ');
    fs.writeFileSync('tmp/live-fixture-cleanup.sql',`begin;\ndelete from public.job_postings where created_by=${quote(accounts[1].id)} and title like ${quote('Synthetic browser test '+accounts[0].id+'%')};\ndelete from auth.users where (${conditions}) and raw_app_meta_data->>'internmatch_test'='true';\ncommit;\n`);
    const settings=await request('/auth/v1/settings');
    fs.mkdirSync('docs/evidence',{recursive:true});
    fs.writeFileSync('docs/evidence/auth-settings.json',JSON.stringify({checkedAt:new Date().toISOString(),status:settings.status,emailEnabled:settings.data.external?.email,signupDisabled:settings.data.disable_signup,mailerAutoconfirm:settings.data.mailer_autoconfirm},null,2));
    console.log('Prepared synthetic credentials in ignored tmp; no account was created by this phase.');return;
  }
  const accounts=JSON.parse(fs.readFileSync(secretFile));
  if(phase==='check'){
    const checks=[];const s=accounts[0],a=accounts[1];
    for(const account of accounts){const r=await request('/auth/v1/token?grant_type=password','POST',{email:account.email,password:account.password});assert.equal(r.status,200,'Synthetic password login failed');account.token=r.data.access_token;checks.push({test:`${account.role} password login`,status:r.status});}
    const read=await request('/rest/v1/profiles?select=user_id','GET',null,s.token);assert.equal(read.status,200);assert.ok(read.data.every(p=>p.user_id===s.id));checks.push({test:'student profile isolation',status:read.status});
    const escal=await request('/rest/v1/users?id=eq.'+s.id,'PATCH',{role:'Admin'},s.token);assert.equal(escal.status,403);checks.push({test:'direct role escalation denied',status:escal.status});
    const meta=await request('/auth/v1/user','PUT',{data:{role:'Admin'}},s.token);assert.equal(meta.status,200);
    const check=await request('/rest/v1/rpc/is_admin','POST',{},s.token);assert.equal(check.data,false);checks.push({test:'metadata escalation denied',status:check.status});
    const cross=await request('/rest/v1/rpc/calculate_recommendations_for_user','POST',{p_user_id:a.id},s.token);assert.equal(cross.status,403);checks.push({test:'cross-user recommendation denied',status:cross.status});
    const saved=await request('/rest/v1/rpc/save_profile','POST',{p_profile:{institution:'Synthetic API test',field_of_study:'Computer Science',career_interests:'Python'},p_skill_ids:[]},s.token);assert.equal(saved.status,200);checks.push({test:'atomic profile save HTTP',status:saved.status});
    const rec=await request('/rest/v1/rpc/calculate_recommendations_for_user','POST',{p_user_id:s.id},s.token);assert.equal(rec.status,200);checks.push({test:'own recommendations HTTP',status:rec.status,count:rec.data.length});
    const admin=await request('/rest/v1/rpc/is_admin','POST',{},a.token);assert.equal(admin.data,true);checks.push({test:'admin authorization HTTP',status:admin.status});
    const off=await request('/rest/v1/rpc/admin_update_user','POST',{p_user_id:s.id,p_name:'Synthetic API test',p_role:'Student',p_status:'Inactive'},a.token);assert.equal(off.status,204);
    const denied=await request('/rest/v1/rpc/save_profile','POST',{p_profile:{},p_skill_ids:[]},s.token);assert.equal(denied.status,403);checks.push({test:'existing JWT denied after deactivation',status:denied.status});
    const logout=await request('/auth/v1/logout','POST',{},a.token);assert.equal(logout.status,204);
    const stale=await request('/rest/v1/rpc/save_job','POST',{p_job_id:null,p_job:{},p_skills:[]},a.token);assert.equal(stale.status,403);checks.push({test:'logout invalidates protected operations with old JWT',status:stale.status});
    fs.writeFileSync('docs/evidence/live-auth.json',JSON.stringify({testedAt:new Date().toISOString(),environment:'Live Supabase Auth password login and REST; dedicated synthetic accounts provisioned by SQL, not email signup',checks},null,2));
    console.log(checks);return;
  }
  throw new Error('Use prepare or check');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
