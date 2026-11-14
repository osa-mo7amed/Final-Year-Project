// Live RPC round-trip timing, excluding login and rendering. Do not confuse with PR-4 end-to-end.
const fs=require('node:fs');
(async()=>{
  const {SUPABASE_URL:url,SUPABASE_ANON_KEY:key,INTERNMATCH_TEST_EMAIL:email,INTERNMATCH_TEST_PASSWORD:password}=process.env;
  if(!url||!key||!email||!password)throw new Error('Set SUPABASE_URL, SUPABASE_ANON_KEY, INTERNMATCH_TEST_EMAIL and INTERNMATCH_TEST_PASSWORD. Use a dedicated test account.');
  const login=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const session=await login.json();if(!login.ok)throw new Error('Test login failed');
  const headers={apikey:key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'};
  const durations=[];
  try{
    for(let i=0;i<20;i++){
      const start=performance.now();const r=await fetch(url+'/rest/v1/rpc/calculate_recommendations_for_user',{method:'POST',headers,body:JSON.stringify({p_user_id:session.user.id})});
      await r.json();if(!r.ok)throw new Error('Recommendation request failed: '+r.status);durations.push(performance.now()-start);
    }
    const sorted=[...durations].sort((a,b)=>a-b);
    const report={measuredAt:new Date().toISOString(),measurement:'Live RPC round trip, excluding authentication and browser rendering',runs:durations,mean:durations.reduce((a,b)=>a+b,0)/20,median:(sorted[9]+sorted[10])/2,p95:sorted[18],max:sorted[19]};
    fs.mkdirSync('evaluation/results',{recursive:true});fs.writeFileSync('evaluation/results/live-latency.json',JSON.stringify(report,null,2));console.log(report);
  }finally{await fetch(url+'/auth/v1/logout',{method:'POST',headers});}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
