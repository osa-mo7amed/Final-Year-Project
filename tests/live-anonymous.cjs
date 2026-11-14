const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const config=fs.readFileSync('frontend/js/supabase-config.js','utf8');
const {url,key}=vm.runInNewContext(config.replace(/const supabaseClient[\s\S]*/, '')+';({url:SUPABASE_URL,key:SUPABASE_ANON_KEY})');
(async()=>{
  const checks=[];
  for(const path of ['users?select=id','job_postings?select=job_posting_id','rpc/calculate_recommendations_for_user']){
    const rpc=path.startsWith('rpc/');const r=await fetch(url+'/rest/v1/'+path,{method:rpc?'POST':'GET',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},...(rpc?{body:JSON.stringify({p_user_id:'00000000-0000-4000-8000-000000000000'})}:{})});
    checks.push({path,status:r.status});await r.text();assert.ok([401,403].includes(r.status));
  }
  fs.mkdirSync('docs/evidence',{recursive:true});fs.writeFileSync('docs/evidence/live-anonymous.json',JSON.stringify({measuredAt:new Date().toISOString(),project:'uszwimitxmzqwtqlugxx',checks},null,2));console.log(checks);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
