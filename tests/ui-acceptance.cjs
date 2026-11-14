// Isolated browser acceptance: SDK requests are mocked; all other external traffic blocked.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {mockSDK}=require('./browser-fixtures.cjs');
const pw=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const run=new Date().toISOString().replace(/[:.]/g,'-');
const out=path.join('docs/evidence','ui-acceptance-'+run);fs.mkdirSync(out,{recursive:true});
const skills=[{skill_id:1,skill_name:'Python',category:'Technical',is_required:true},{skill_id:2,skill_name:'Communication',category:'Soft',is_required:true}];
const base={company:'Synthetic Alpha',description:'Synthetic fixture only',location:'Remote',industry:'Information Technology',deadline:'2099-12-31',job_type:'Internship',status:'Active',matched_skills:skills,missing_skills:[],explanation:'Synthetic score; not quality evidence.'};
const jobs=[{...base,job_posting_id:1,title:'Synthetic Python A',match_score:90},{...base,job_posting_id:2,title:'Synthetic Python B',match_score:90,matched_skills:[skills[0]],missing_skills:[{...skills[1],is_required:false}]},{...base,job_posting_id:3,title:'Synthetic Analyst',company:'Synthetic Beta',match_score:80,job_type:'Full-Time',location:'Penang',industry:'Banking & Finance'},{...base,job_posting_id:4,title:'Synthetic Engineer',match_score:70,location:'Cyberjaya',matched_skills:[skills[1]]}];
const report={runAt:new Date().toISOString(),scope:'Stage 2.3.1; repository files fulfilled by Playwright routing and synthetic mocked SDK; not HTTP server/live backend/UAT/performance',jobs:4,checks:[],launches:[],externalRequestsBlocked:[],screenshots:[]};
let server;
(async()=>{
 server=spawn(process.execPath,['scripts/serve.cjs'],{env:{...process.env,PORT:'8083'},windowsHide:true});
 await new Promise((ok,bad)=>{server.stdout.once('data',ok);server.once('error',bad);server.once('exit',c=>bad(Error('Server exit '+c)));});
 for(const channel of ['chrome','msedge']){
  let browser;try{browser=await pw.chromium.launch({channel,headless:true,timeout:20000});report.launches.push({channel,status:'PASS',version:browser.version()});}catch(e){report.launches.push({channel,status:'BLOCKED',error:e.message.split('\n')[0]});continue;}
  try{for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'&&u.port==='8083'){const file=path.resolve('.','.'+u.pathname);if(!file.startsWith(process.cwd()+path.sep))return route.abort();const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};return fs.existsSync(file)?route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'}):route.fulfill({status:404,body:'Not found'});}if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',body:`(${mockSDK.toString()})()`});report.externalRequestsBlocked.push(u.origin);return route.abort();});
   await context.addInitScript(j=>{window.__jobs=j;},jobs);
   const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const go=name=>page.goto('http://127.0.0.1:8083/frontend/pages/'+name+'.html');
   const check=async(name,fn)=>{try{await fn();report.checks.push({channel,width,name,status:'PASS'});}catch(e){report.checks.push({channel,width,name,status:'FAIL',error:e.message});}};
   const titles=()=>page.locator('.job-title').allTextContents();
   await go('search');await page.waitForFunction(()=>document.querySelectorAll('.job-card').length===3);
   await check('combined filters and required-skill AND exclude preferred-only match',async()=>{
    await page.locator('#search-input').fill('python');await page.locator('#industry-filter').selectOption('Information Technology');await page.locator('#location-filter').selectOption('Remote');
    await page.locator('input[name=skillFilter][value="1"]').check();await page.locator('input[name=skillFilter][value="2"]').check();await page.locator('#apply-filters-btn').click();assert.deepEqual(await titles(),['Synthetic Python A']);
   });
   await check('reset restores complete corpus and preserves equal-score input order',async()=>{await page.locator('#reset-filters-btn').click();assert.deepEqual(await titles(),jobs.map(j=>j.title));});
   await check('company and placement/location filters',async()=>{await page.locator('#search-input').fill('beta');await page.locator('input[name=jobType][value="Full-Time"]').check();await page.locator('#location-filter').selectOption('Penang');await page.locator('#search-btn').click();assert.deepEqual(await titles(),['Synthetic Analyst']);});
   await check('no-results reset and keyboard Enter search',async()=>{await page.locator('#reset-filters-btn').click();await page.locator('#search-input').fill('not-a-fixture');await page.locator('#search-input').press('Enter');await page.locator('#clear-all-btn').click();assert.equal(await page.locator('.job-card').count(),4);});
   await check('filter selects have accessible labels',async()=>{assert.equal(await page.getByLabel('Industry Sector',{exact:true}).count(),1);assert.equal(await page.getByLabel('Location / Mode',{exact:true}).count(),1);});
   await check('search has no horizontal overflow',async()=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);});
   await check('outage remains unavailable after Reset, not empty successful results',async()=>{await page.evaluate(()=>window.__rpcError=true);await page.evaluate(()=>fetchAllJobs());await page.locator('#reset-filters-btn').click();assert.equal(await page.locator('#available-count-badge').innerText(),'Unavailable');});
   await check('outage retry restores listings and clears stale error after service recovers',async()=>{await page.evaluate(()=>window.__rpcError=false);await page.locator('#retry-search-btn').click();await page.waitForFunction(()=>document.querySelectorAll('.job-card').length===4);assert.deepEqual(await titles(),jobs.map(j=>j.title));assert.equal(await page.locator('#search-alert').evaluate(el=>el.classList.contains('is-visible')),false);});
   await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
   const searchShot=`${channel}-search-${width}.png`;await page.screenshot({path:path.join(out,searchShot),fullPage:true});report.screenshots.push(searchShot);
   await go('dashboard');await page.waitForSelector('.view-details-btn');
   await check('keyboard dialog focus trap, Escape and focus return',async()=>{
    const trigger=page.locator('.view-details-btn').first();await trigger.focus();await trigger.press('Enter');await page.waitForFunction(()=>document.activeElement.id==='close-modal-btn');
    const box=page.locator('#job-modal .modal-box');const buttons=box.locator('a[href],button:not([disabled])');const last=buttons.last();await last.focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'close-modal-btn');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#job-modal').classList.contains('is-open'));assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
   });
   await check('page alerts provide polite live regions',async()=>{assert.equal(await page.locator('#dashboard-alert').getAttribute('aria-live'),'polite');});
   await check('no uncaught page errors',async()=>assert.deepEqual(errors,[]));
   await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
   const shot=`${channel}-dashboard-${width}.png`;await page.screenshot({path:path.join(out,shot),fullPage:true});report.screenshots.push(shot);
   await context.close();
  }}finally{await browser.close();}
 }
})().catch(e=>{report.fatal=e.message;process.exitCode=1;}).finally(()=>{
 if(server)server.kill();report.externalRequestsBlocked=[...new Set(report.externalRequestsBlocked)];
 report.sourceSha256=Object.fromEntries(['tests/ui-acceptance.cjs','tests/browser-fixtures.cjs','frontend/js/search.js','frontend/js/experience.js','frontend/pages/search.html'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 report.summary={passed:report.checks.filter(x=>x.status==='PASS').length,failed:report.checks.filter(x=>x.status==='FAIL').length};
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:out,summary:report.summary,launches:report.launches,failures:report.checks.filter(x=>x.status==='FAIL'),fatal:report.fatal},null,2));if(report.summary.failed||report.fatal||!report.checks.length)process.exitCode=1;
});
