const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function authContext(row,session={user:{id:'test',user_metadata:{role:'Admin'}}}){
  const redirects=[];
  const ctx={window:{location:{replace:p=>redirects.push(p)},addEventListener(){}},location:{pathname:'/dashboard.html'},console,
    supabaseClient:{auth:{getSession:async()=>({data:{session}}),signOut:async()=>({error:null})},from(){return{select(){return this;},eq(){return this;},maybeSingle:async()=>({data:row,error:null})};}}};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync('frontend/js/auth.js','utf8'),ctx);return {ctx,redirects};
}
test('frontend role cannot be elevated through metadata',async()=>{
  const {ctx,redirects}=authContext({role:'Student',account_status:'Active'});
  assert.equal(ctx.resolveEffectiveRole({role:'Student'},{user_metadata:{role:'Admin'}}),'Student');
  assert.equal(await ctx.requireAuth('Admin'),null);assert.equal(redirects[0],'dashboard.html');
});
test('frontend protected route fails closed for absent/inactive account and no session',async()=>{
  for(const [row,session]of [[null,undefined],[{role:'Student',account_status:'Inactive'},undefined],[{},null]]){
    const {ctx,redirects}=authContext(row,session);assert.equal(await ctx.requireAuth(),null);assert.match(redirects[0],/login/);
  }
});
test('frontend uses one recommendation endpoint and exposes backend errors',async()=>{
  let called;
  const ctx={window:{},performance:{now:()=>1},supabaseClient:{rpc:async(name,args)=>{called={name,args};return {data:[],error:null};}}};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync('frontend/js/recommendations.js','utf8'),ctx);
  assert.equal((await ctx.fetchRecommendations('test')).length,0);assert.equal(called.name,'calculate_recommendations_for_user');
  ctx.supabaseClient.rpc=async()=>({error:{message:'Server down'}});
  await assert.rejects(ctx.fetchRecommendations('test'),/could not be loaded/);
});
