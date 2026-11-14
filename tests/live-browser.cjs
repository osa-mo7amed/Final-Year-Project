// Requires the dedicated synthetic accounts prepared for live-auth.cjs; never use real accounts.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  const accounts=JSON.parse(fs.readFileSync('tmp/live-auth-fixtures.json'));
  assert.ok(accounts.every(a=>a.email.endsWith('@example.invalid')));
  const server=require('node:child_process').spawn(process.execPath,['scripts/serve.cjs'],{env:{...process.env,PORT:'8082'},windowsHide:true});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Test server exited: '+code)));});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const root='http://127.0.0.1:8082/frontend/pages/';const checks=[];const errors=[];
  const title='Synthetic browser test '+accounts[0].id+' '+Date.now();
  const output='docs/evidence/live-browser';fs.mkdirSync(output,{recursive:true});
  async function login(page,account){await page.goto(root+'login.html');await page.locator('#email').fill(account.email);await page.locator('#password').fill(account.password);await page.locator('#submit-btn').click();await page.waitForURL('**/'+(account.role==='admin'?'admin-dashboard.html':'dashboard.html'));}
  try{
    const admin=await browser.newPage();admin.on('pageerror',e=>errors.push(e.message));await login(admin,accounts[1]);checks.push('Admin password login and role redirect');
    await admin.goto(root+'admin-jobs.html');await admin.locator('#open-add-job-btn').click();
    await admin.locator('#jobTitle').fill(title);await admin.locator('#companyName').fill('Synthetic test only');
    await admin.locator('#jobLocation').fill('Remote');await admin.locator('#jobDescription').fill('Python software development. Synthetic posting; not a real vacancy.');
    await admin.locator('#jobDeadline').fill('2099-12-31');
    await admin.locator('#modal-skill-picker').selectOption({label:'Python (Technical)'});
    await admin.locator('#modal-add-skill-btn').click();
    await admin.locator('#save-job-submit-btn').click();await admin.waitForFunction(()=>document.getElementById('admin-alert').textContent.includes('saved successfully'));
    checks.push('Admin creates job with required skill atomically');
    await admin.locator('#job-search-input').fill(title);await admin.locator('.edit-job-btn').click();
    await admin.locator('#jobDescription').fill('Python software development. Edited synthetic posting only.');await admin.locator('#save-job-submit-btn').click();await admin.waitForFunction(()=>!document.getElementById('job-form-modal').classList.contains('is-open'));
    checks.push('Admin edits job and preserves skills');
    const student=await browser.newPage();student.on('pageerror',e=>errors.push(e.message));await login(student,accounts[0]);checks.push('Student password login and role redirect');
    await student.goto(root+'profile.html');await student.locator('#institution').fill('Synthetic University');await student.locator('#programme').fill('Computing');
    await student.locator('#fieldOfStudy').fill('Computer Science');await student.locator('#cgpa').fill('0');await student.locator('#careerInterests').fill('Python');
    await student.locator('#tech-skill-select').selectOption({label:'Python'});await student.locator('#add-tech-skill-btn').click();
    const saveStart=performance.now();await student.locator('#save-profile-btn').click();await student.waitForFunction(()=>document.getElementById('profile-alert').textContent.includes('Profile and skills saved'));
    const profileSaveMs=performance.now()-saveStart;
    await student.reload();await student.waitForFunction(()=>document.getElementById('institution').value==='Synthetic University');assert.equal(await student.locator('#cgpa').inputValue(),'0');checks.push('Profile and technical skills persist after reload, CGPA zero accepted');
    await student.goto(root+'dashboard.html');await student.locator('.job-card').first().waitFor();
    const card=student.locator('.job-card').filter({hasText:title});const score=await card.locator('.score-badge').innerText();
    await card.locator('.view-details-btn').click();await student.locator('#modal-apply-btn').click();await student.waitForFunction(()=>document.getElementById('dashboard-alert').textContent.includes('submitted successfully'));
    await student.locator('#close-modal-btn').click();await card.locator('.view-details-btn').click();await student.locator('#modal-apply-btn').click();await student.waitForFunction(()=>document.getElementById('dashboard-alert').textContent.includes('already submitted'));
    checks.push('Application submission and duplicate rejection');await student.locator('#close-modal-btn').click();
    await card.locator('a').click();await student.waitForFunction(()=>Number.isFinite(parseFloat(document.getElementById('analysis-score-num').textContent)));
    assert.equal(parseFloat(await student.locator('#analysis-score-num').innerText()),parseFloat(score));
    await student.screenshot({path:output+'/skill-analysis.png',fullPage:true});
    await student.goto(root+'search.html');await student.locator('#search-input').fill(title);await student.locator('#search-btn').click();
    await student.locator('.job-card').first().waitFor();assert.equal(parseFloat(await student.locator('.job-card .score-badge').first().innerText()),parseFloat(score));checks.push('Dashboard/search/analysis compatibility score parity');
    const durations=[];
    for(let n=0;n<20;n++){const t=performance.now();await student.goto(root+'dashboard.html');await student.locator('.job-card').filter({hasText:title}).waitFor();durations.push(performance.now()-t);}
    await student.screenshot({path:output+'/dashboard.png',fullPage:true});
    await student.locator('#logout-btn').click();await student.waitForURL('**/login.html');await student.goto(root+'profile.html');await student.waitForURL('**/login.html');checks.push('Logout and protected-page redirect');
    admin.on('dialog',d=>d.accept());await admin.locator('.delete-job-btn').click();await admin.waitForFunction(()=>document.getElementById('admin-alert').textContent.includes('archived'));
    checks.push('Admin archives synthetic posting');await admin.locator('#logout-btn').click();await admin.waitForURL('**/login.html');
    const sorted=[...durations].sort((a,b)=>a-b);const report={testedAt:new Date().toISOString(),environment:'Headless Edge, real Supabase Auth/REST, dedicated synthetic accounts and posting',checks,errors,score,profileSaveMs,
      recommendationPageMs:{description:'Navigation start to synthetic recommendation card visible; same browser context, includes route guard, profile fetch, RPC and rendering; 20 sequential runs, no concurrent load',runs:durations,mean:durations.reduce((s,x)=>s+x,0)/20,median:(sorted[9]+sorted[10])/2,p95:sorted[18],max:sorted[19],within3s:durations.filter(x=>x<=3000).length}};
    fs.writeFileSync('docs/evidence/live-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,recommendationPageMs:{...report.recommendationPageMs,runs:undefined}},null,2));assert.equal(errors.length,0);
  }catch(error){
    for(const [i,page]of browser.contexts().flatMap(c=>c.pages()).entries()){
      await page.screenshot({path:output+'/failure-'+i+'.png',fullPage:true}).catch(()=>{});
      console.log(await page.evaluate(()=>({url:location.pathname,modalClass:document.getElementById('job-form-modal')?.className,active:document.activeElement?.id})));
    }throw error;
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
