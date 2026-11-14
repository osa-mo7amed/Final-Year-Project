const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {database,actor} = require('./database.cjs');
let db;
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333';
before(async()=>{
  db=await database();
  for(const id of [a,b,admin]) {
    await db.query("insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values($1,'{\"role\":\"Admin\",\"full_name\":\"Synthetic Test\"}',now())",[id]);
    await db.query('insert into auth.sessions values($1,$1)',[id]);
  }
  await db.query("update public.users set role='Admin' where id=$1",[admin]);
});
after(async()=>db?.close());
test('signup cannot grant Admin; metadata cannot authorize Admin',async()=>{
  await actor(db,a,{role:'Admin'});
  assert.equal((await db.query('select role from public.users')).rows[0].role,'Student');
  assert.equal((await db.query('select public.is_admin() value')).rows[0].value,false);
});
test('anonymous reads, writes and RPCs denied',async()=>{
  await actor(db,null);
  for(const sql of ['select * from public.users','select * from public.job_postings',`select * from public.calculate_recommendations_for_user('${a}')`,'truncate public.users cascade']) await assert.rejects(db.exec(sql),{code:'42501'});
});
test('own profile only; direct escalation and cross-user RPC denied',async()=>{
  await actor(db,a);
  assert.equal((await db.query('select * from public.profiles')).rows.length,1);
  await assert.rejects(db.exec("update public.users set role='Admin'"),{code:'42501'});
  await assert.rejects(db.query('select * from public.calculate_recommendations_for_user($1)',[b]),{code:'42501'});
  await assert.rejects(db.query('select public.get_skill_analysis_for_job($1,1)',[b]),{code:'42501'});
  await assert.rejects(db.query("select public.admin_update_user($1,'Bad','Admin','Active')",[a]),{code:'42501'});
});
test('profile saves atomically and server computes strength including CGPA zero',async()=>{
  await actor(db,a);
  await db.query('select public.save_profile($1,$2)',[{institution:'Test',cgpa:0},[1,2]]);
  const before=(await db.query('select * from public.profiles')).rows[0];
  assert.equal(before.profile_strength,46);
  await assert.rejects(db.query('select public.save_profile($1,$2)',[{institution:'Broken'},[999999]]),{code:'23503'});
  assert.equal((await db.query('select institution from public.profiles')).rows[0].institution,'Test');
  assert.equal((await db.query('select * from public.profile_skills')).rows.length,2);
});
test('admin job save is atomic; deterministic ranking; expired/closed excluded',async()=>{
  await actor(db,admin);
  const job={title:'Test Python',company:'Synthetic',description:'Python role',location:'Remote',industry:'Software',job_type:'Internship',status:'Active'};
  for(const j of [job,job,{...job,status:'Closed'},{...job,deadline:'2000-01-01'}]) await db.query('select public.save_job(null,$1,$2)',[j,[{skill_id:1,is_required:true}]]);
  await assert.rejects(db.query('select public.save_job(1,$1,$2)',[{...job,title:'Broken'},[{skill_id:999999,is_required:true}]]),{code:'23503'});
  assert.equal((await db.query('select title from public.job_postings where job_posting_id=1')).rows[0].title,job.title);
  await actor(db,a);
  const rows=(await db.query('select * from public.calculate_recommendations_for_user($1)',[a])).rows;
  assert.deepEqual(rows.map(r=>r.job_posting_id),[1,2]);
  const detail=(await db.query('select public.get_skill_analysis_for_job($1,1) value',[a])).rows[0].value;
  assert.equal(detail.match_score,Number(rows[0].match_score));
});
test('applications enforce ownership, deadline and uniqueness; archive preserves history',async()=>{
  await actor(db,a);
  await db.query('insert into public.applications(user_id,job_posting_id) values($1,1)',[a]);
  await assert.rejects(db.query('insert into public.applications(user_id,job_posting_id) values($1,1)',[a]),{code:'23505'});
  for(const [id,jid] of [[b,2],[a,3],[a,4]]) await assert.rejects(db.query('insert into public.applications(user_id,job_posting_id) values($1,$2)',[id,jid]),{code:'42501'});
  await actor(db,admin); await db.exec('select public.archive_job(1)');
  assert.equal((await db.query('select * from public.applications')).rows.length,1);
});
test('admin manages users; self lockout denied; inactive and revoked sessions blocked',async()=>{
  await actor(db,admin);
  assert.equal((await db.query('select * from public.users')).rows.length,3);
  await assert.rejects(db.query("select public.admin_update_user($1,'Admin','Student','Active')",[admin]),{code:'22023'});
  await db.query("select public.admin_update_user($1,'Inactive','Student','Inactive')",[a]);
  await actor(db,a);
  assert.equal((await db.query('select * from public.profiles')).rows.length,0);
  await assert.rejects(db.exec("select public.save_profile('{}','{}')"),{code:'42501'});
  await assert.rejects(db.query('select * from public.calculate_recommendations_for_user($1)',[a]),{code:'42501'});
  await db.exec('reset role'); await db.query('delete from auth.sessions where user_id=$1',[b]);
  await actor(db,b); assert.equal((await db.query('select * from public.skills')).rows.length,0);
});
test('scoring: weights, rounding, empty lists, literal interests, normalized field',async()=>{
  await actor(db,admin);
  const score=async(p,j)=>(await db.query('select public.score_compatibility($1,$2) value',[p,j])).rows[0].value;
  assert.equal((await score({},{})).match_score,50);
  const skills=[1,2,3].map(skill_id=>({skill_id,is_required:true})).concat({skill_id:4,is_required:false});
  const p={skill_ids:[1,2,4],field_of_study:' Computer Science ',career_interests:'Python, missing, PYTHON, ,'};
  const j={skills,industry:'SOFTWARE',title:'Python engineer'};
  assert.equal((await score(p,j)).match_score,75.83);
  assert.equal((await score({...p,career_interests:'['},j)).factors.interests,0);
  assert.equal((await score({...p,field_of_study:''},{...j,industry:''})).factors.field,0);
  assert.equal((await score({skill_ids:[1,2,3,4],field_of_study:'Software',career_interests:'Python'},j)).match_score,100);
});
test('profile completeness UI and database agree across skill thresholds',async()=>{
  const strength=require('../frontend/js/profile-strength');
  await actor(db,admin);
  const catalog=(await db.query('select skill_id,category from public.skills order by skill_id')).rows;
  const technical=catalog.filter(s=>s.category==='Technical').slice(0,4);
  const soft=catalog.filter(s=>s.category==='Soft').slice(0,3);
  for(let t=0;t<=4;t++)for(let s=0;s<=3;s++){
    const skills=[...technical.slice(0,t),...soft.slice(0,s)];
    const profile={institution:'University',programme:'Computing',field_of_study:'Computer Science',cgpa:0,career_interests:'Python',certifications:'Course'};
    await db.query('select public.save_profile($1,$2)',[profile,skills.map(s=>s.skill_id)]);
    const actual=(await db.query('select profile_strength from public.profiles where user_id=$1',[admin])).rows[0].profile_strength;
    assert.equal(actual,strength(profile,skills));
  }
});
