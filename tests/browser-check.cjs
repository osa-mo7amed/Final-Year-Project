// UI integration with explicit mocked Supabase responses. Not live-auth evidence.
const fs=require('node:fs'),assert=require('node:assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out='docs/evidence/browser';fs.mkdirSync(out,{recursive:true});
function mockSDK(){
  const user={id:'11111111-1111-4111-8111-111111111111',user_metadata:{role:'Admin'},email_confirmed_at:'2026-01-01'};
  const role=window.__role || 'Student';
  const profile={profile_id:1,user_id:user.id,institution:'Test University',programme:'Computing',field_of_study:'Computer Science',cgpa:0,year_of_study:0,profile_strength:46,career_interests:'Python',certifications:''};
  const skills=[{skill_id:1,skill_name:'Python',category:'Technical'},{skill_id:2,skill_name:'Communication',category:'Soft'}];
  const job={job_posting_id:1,title:'Synthetic Python Internship',company:'Example Company',description:'A test posting only.',location:'Remote',industry:'Information Technology',deadline:'2099-12-31',job_type:'Internship',status:'Active',match_score:65,
    matched_skills:[{...skills[0],is_required:true}],missing_skills:[{...skills[1],is_required:false,guidance:{learning_direction:'Practice explaining a project.',practice_area:'Communication',expected_outcome:'Present a project clearly.',recommended_duration:'2 weeks'}}],explanation:'Compatibility 65/100: required skills 50 points; preferred 0 points; field 15 points; interests 0 points. Not a hiring probability.',job_skills:skills.map(s=>({skills:s,is_required:s.skill_id===1}))};
  const api={auth:{getSession:async()=>({data:{session:window.__anonymous?null:{user}}}),signInWithPassword:async()=>({data:{user},error:null}),signUp:async()=>({data:{user:{...user,identities:[{}]}},error:null}),signOut:async()=>{window.__anonymous=true;return {error:null};},resetPasswordForEmail:async()=>({error:null})},
    from(table){let action='select',payload,filters=[];const chain={select(){return chain;},eq(k,v){filters.push([k,v]);return chain;},order(){return chain;},insert(p){action='insert';payload=p;return chain;},update(){action='update';return chain;},single(){chain.one=true;return chain;},maybeSingle(){chain.one=true;return chain;},then(resolve){
      let data=[];let error=null;
      if(table==='users')data=[{...user,full_name:'Synthetic Student',role,account_status:window.__inactive?'Inactive':'Active',profiles:{field_of_study:'Computer Science'}}];
      if(table==='profiles')data=[{...profile,...JSON.parse(localStorage.getItem('savedProfile')||'{}')}];
      if(table==='skills')data=skills;
      if(table==='profile_skills')data=[{skill_id:1,skills:skills[0]}];
      if(table==='job_postings')data=[job];
      if(table==='applications'&&action==='insert'){if(window.__applied)error={code:'23505',message:'duplicate'};else window.__applied=true;}
      resolve({data:chain.one?data[0]:data,error});
    }};return chain;},
    async rpc(name,args){
      if(window.__rpcError)return {error:{message:'Simulated outage'}};
      if(name==='calculate_recommendations_for_user')return {data:window.__empty?[]:[job],error:null};
      if(name==='save_profile'){localStorage.setItem('savedProfile',JSON.stringify(args.p_profile));return {data:1,error:null};}
      return {data:1,error:null};
    }};
  window.supabase={createClient:()=>api};
}
(async()=>{
  const server=require('node:child_process').spawn(process.execPath,['scripts/serve.cjs'],{env:{...process.env,PORT:'8081'},windowsHide:true});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited: '+code)));});
  const browser=await playwright.chromium.launch({channel:'msedge',headless:true});const report=[];
  try{
    for(const width of [1440,390]){
      const context=await browser.newContext({viewport:{width,height:900}});
      await context.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'text/javascript',body:`(${mockSDK.toString()})()`}));
      for(const name of ['index','login','register','reset-password','profile','dashboard','search','skill-analysis','admin-dashboard','admin-jobs','admin-users','evaluation-runner']){
        const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(role=>{window.__role=role;},name.startsWith('admin')?'Admin':'Student');
        await page.goto('http://127.0.0.1:8081/'+(name==='index'?'index.html':`frontend/pages/${name}.html`));
        await page.waitForTimeout(300);
        if(name==='dashboard'){await page.locator('.view-details-btn').click();await page.locator('#modal-apply-btn').click();assert.match(await page.locator('#dashboard-alert').innerText(),/successfully/);await page.locator('#close-modal-btn').click();}
        if(name==='profile'){await page.locator('#institution').fill('Persisted University');await page.locator('#save-profile-btn').click();await page.reload();await page.waitForTimeout(100);assert.equal(await page.locator('#institution').inputValue(),'Persisted University');}
        if(name==='search'){
          await page.locator('#search-input').fill('Python');await page.locator('#industry-filter').selectOption('Information Technology');
          await page.locator('#location-filter').selectOption('Remote');await page.locator('input[name="skillFilter"][value="1"]').check();
          await page.locator('#apply-filters-btn').click();assert.equal(await page.locator('.job-card').count(),1);
          await page.locator('input[name="skillFilter"][value="2"]').check();await page.locator('#apply-filters-btn').click();
          assert.equal(await page.locator('.job-card').count(),0,'Preferred skills must not satisfy required-skill filters');
          await page.locator('#clear-all-btn').click();
          await page.locator('#search-input').fill('no-such-posting');await page.locator('#search-btn').click();
          assert.match(await page.locator('#search-results-container').innerText(),/No Listings/);await page.locator('#clear-all-btn').click();assert.equal(await page.locator('.job-card').count(),1);
        }
        if(name==='skill-analysis'){assert.match(await page.locator('#analysis-summary-text').innerText(),/65\/100/);assert.match(await page.locator('#guidance-container').innerText(),/Practice explaining/);}
        if(name==='admin-jobs'){
          await page.locator('#open-add-job-btn').click();await page.locator('#jobTitle').fill('Synthetic test');await page.locator('#companyName').fill('Example');
          await page.locator('#jobLocation').fill('Remote');await page.locator('#jobDescription').fill('Synthetic description');await page.locator('#jobDeadline').fill('2099-12-31');
          await page.locator('#modal-skill-picker').selectOption({label:'Python (Technical)'});await page.locator('#modal-add-skill-btn').click();
          await page.locator('#save-job-submit-btn').click();assert.match(await page.locator('#admin-alert').innerText(),/saved successfully/);
        }
        if(name==='evaluation-runner'){await page.locator('#run-eval-btn').click();await page.waitForFunction(()=>document.getElementById('val-p5').textContent==='58.0%');}
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
        await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});
        report.push({page:name,width,errors,overflow});await page.close();
      }
      await context.close();
    }
    // Explicit backend failure must remain visible; no alternate score engine.
    const context=await browser.newContext();await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'text/javascript',body:`(${mockSDK.toString()})()`}));
    const page=await context.newPage();await page.addInitScript(()=>{window.__rpcError=true;});
    await page.goto('http://127.0.0.1:8081/frontend/pages/dashboard.html');await page.waitForFunction(()=>document.getElementById('recommendations-container').textContent.includes('could not be loaded'));
    await context.close();
    fs.writeFileSync('docs/evidence/browser-results.json',JSON.stringify({date:new Date().toISOString(),environment:'Headless Microsoft Edge; mocked Supabase responses',checks:report,outageState:'PASS'},null,2));
    console.log(JSON.stringify(report,null,2));assert.equal(report.filter(r=>r.errors.length||r.overflow).length,0,'Browser errors or horizontal page overflow');
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
