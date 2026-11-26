// Mocked SDK/controller regression. No network, real accounts or email delivery.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
  const elements={},handlers={},redirects=[],alerts=[],timers=[];
  const el=id=>elements[id] ||= {value:'',disabled:false,textContent:'',className:'',addEventListener:(event,fn)=>handlers[id+':'+event]=fn};
  const location={href:'http://127.0.0.1:8080/frontend/pages/register.html',pathname:'/register.html',replace:p=>redirects.push(p)};
  const auth={signUp:async()=>({data:{user:{identities:[{}]},session:null}}),signInWithPassword:async()=>({data:{user:{id:'synthetic'}}}),getSession:async()=>({data:{session:{user:{id:'synthetic'}}}}),signOut:async()=>({error:null}),updateUser:async()=>({error:null})};
  let row={role:'Student',account_status:'Active'};
  const ctx={URL,location,window:{location,addEventListener(){}},document:{getElementById:el},alert:s=>alerts.push(s),setTimeout:fn=>timers.push(fn),supabaseClient:{auth,from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:row})})}};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync('frontend/js/auth.js','utf8'),ctx);
  const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx);
  const form={fullName:{value:'Synthetic Student'},email:{value:'test@example.invalid'},password:{value:'test-only-password'},confirmPassword:{value:'test-only-password'},academicStatus:{value:'Student'},fieldOfStudy:{value:'Computing'},reset(){this.wasReset=true}};
  return {ctx,auth,el,handlers,redirects,alerts,timers,form,load,row:r=>row=r,event:{preventDefault(){},target:form}};
}
test('registration sends explicit verification destination and does not assert delivery',async()=>{
 const s=setup();let args;s.auth.signUp=async a=>(args=a,{data:{user:{identities:[{}]},session:null}});
 await s.ctx.handleRegister(s.event);assert.equal(args.options.emailRedirectTo,'http://127.0.0.1:8080/frontend/pages/profile.html');assert.match(s.el('form-alert').textContent,/Check your email/);assert.equal(s.el('submit-btn').disabled,false);
});
test('registration validation and duplicate response do not reset form or redirect',async()=>{
 const s=setup();let calls=0;s.auth.signUp=async()=>{calls++;return {data:{user:{identities:[]}}}};
 s.form.confirmPassword.value='mismatch';await s.ctx.handleRegister(s.event);assert.equal(calls,0);
 s.form.confirmPassword.value=s.form.password.value;await s.ctx.handleRegister(s.event);assert.equal(calls,1);assert.equal(s.form.wasReset,undefined);assert.equal(s.timers.length,0);assert.match(s.el('form-alert').textContent,/already registered/);
});
test('registration transport failure restores submit control',async()=>{
 const s=setup();s.auth.signUp=async()=>{throw Error('offline')};await s.ctx.handleRegister(s.event);assert.equal(s.el('submit-btn').disabled,false);assert.match(s.el('form-alert').textContent,/could not be reached/);
});
test('login rejects invalid credentials and does not reveal which field failed',async()=>{
 const s=setup();s.auth.signInWithPassword=async()=>({error:{message:'user missing'}});await s.ctx.handleLogin(s.event);assert.match(s.el('form-alert').textContent,/Incorrect email or password/);assert.match(s.ctx.location.href,/register/);
});

test('returned SDK connection errors preserve registration inputs and allow retry',async()=>{
 for(const error of [{name:'AuthRetryableFetchError',message:'Failed to fetch',status:0},{message:'NetworkError when attempting to fetch resource.'},{message:'Load failed'}]){
  const s=setup();s.auth.signUp=async()=>({data:null,error});await s.ctx.handleRegister(s.event);
  assert.match(s.el('form-alert').textContent,/account service could not be reached/);
  assert.equal(s.el('submit-btn').disabled,false);assert.equal(s.form.wasReset,undefined);assert.equal(s.timers.length,0);
 }
});

test('login connection failures are not reported as incorrect credentials',async()=>{
 const s=setup();s.auth.signInWithPassword=async()=>({error:{name:'AuthRetryableFetchError',message:'Failed to fetch'}});
 await s.ctx.handleLogin(s.event);assert.match(s.el('form-alert').textContent,/account service could not be reached/);
 assert.equal(s.el('submit-btn').disabled,false);assert.match(s.ctx.location.href,/register/);
});
test('login refuses missing, inactive and invalid-role account rows',async()=>{
 for(const row of [null,{role:'Student',account_status:'Inactive'},{role:'Unexpected',account_status:'Active'}]){
  const s=setup();s.row(row);await s.ctx.handleLogin(s.event);assert.match(s.ctx.location.href,/register/);assert.equal(s.el('submit-btn').disabled,false);
 }
});
test('login uses database role for routing',async()=>{
 for(const role of ['Student','Graduate','Admin']){const s=setup();s.row({role,account_status:'Active'});await s.ctx.handleLogin(s.event);assert.equal(s.ctx.location.href,role==='Admin'?'admin-dashboard.html':'dashboard.html');}
});
test('logout reported and thrown errors do not claim successful redirect',async()=>{
 for(const thrown of [false,true]){const s=setup();s.auth.signOut=async()=>{if(thrown)throw Error('offline');return {error:Error('offline')}};await s.ctx.handleLogout();assert.equal(s.redirects.length,0);assert.match(s.alerts[0],/failed/);}
 const s=setup();await s.ctx.handleLogout();assert.deepEqual(s.redirects,['login.html']);
});
test('guard returns null and redirects after session or profile transport failure',async()=>{
 for(const where of ['session','profile']){const s=setup();if(where==='session')s.auth.getSession=async()=>{throw Error('offline')};else s.ctx.supabaseClient.from=()=>{throw Error('offline')};assert.equal(await s.ctx.requireAuth(),null);assert.deepEqual(s.redirects,['login.html?reason=service']);}
});
test('recovery prevents update for short, mismatched and absent-session cases',async()=>{
 for(const mode of ['short','mismatch','no-session']){const s=setup();let writes=0;s.auth.updateUser=async()=>{writes++;return {}};s.el('password').value=mode==='short'?'short':'test-only-password';s.el('confirmPassword').value=mode==='mismatch'?'different':s.el('password').value;if(mode==='no-session')s.auth.getSession=async()=>({data:{session:null}});s.load('frontend/js/recovery.js');await s.handlers['recovery-form:submit'](s.event);assert.equal(writes,0);assert.equal(s.el('submit-btn').disabled,false);}
});
test('recovery distinguishes password-update failure from sign-out failure',async()=>{
 for(const mode of ['update','logout','success']){const s=setup();s.el('password').value=s.el('confirmPassword').value='test-only-password';s.auth.updateUser=async()=>({error:mode==='update'?Error('expired'):null});s.auth.signOut=async()=>({error:mode==='logout'?Error('offline'):null});s.load('frontend/js/recovery.js');await s.handlers['recovery-form:submit'](s.event);assert.match(s.el('form-alert').textContent,mode==='update'?/could not be changed/:mode==='logout'?/session may still be active/:/You can now sign in/);assert.equal(s.el('submit-btn').disabled,false);}
});
test('admin signup is isolated and cleanup failure restores control',async()=>{
 const s=setup();const notices=[];let options;s.ctx.SUPABASE_URL='https://example.invalid';s.ctx.SUPABASE_ANON_KEY='synthetic-public-placeholder';s.ctx.showToast=m=>notices.push(m);s.ctx.fetchAdminUsers=async()=>{};
 s.ctx.window.supabase={createClient:(u,k,o)=>{options=o;return {auth:{signUp:async()=>({data:{session:null,user:{identities:[{}]}}}),getSession:async()=>{throw Error('offline')}}}}};
 const form={reportValidity:()=>true,reset(){},elements:Object.fromEntries(['newEmail','newPassword','newName','newRole','newField'].map(n=>[n,{value:n==='newRole'?'Student':'Synthetic'}]))};
 s.load('frontend/js/admin-create-user.js');await s.handlers['create-user-form:submit']({preventDefault(){},target:form});assert.equal(options.auth.persistSession,false);assert.equal(options.auth.storageKey,'internmatch-account-creation');assert.equal(s.el('create-user-btn').disabled,false);assert.match(notices.at(-1),/sign out could not be confirmed/);
});
