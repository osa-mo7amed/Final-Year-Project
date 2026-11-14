// Synthetic regression evaluation. Runs the production SQL scorer in local PostgreSQL.
const fs=require('node:fs'),crypto=require('node:crypto');
const {database}=require('../tests/database.cjs');
const {metrics,aggregate}=require('./metrics');
(async()=>{
  const fixture=JSON.parse(fs.readFileSync('evaluation/fixtures-v1.json','utf8'));
  const names=[...new Set(fixture.jobCorpus.flatMap(j=>[...j.req_tech,...j.pref_tech,...j.soft]).concat(fixture.studentProfiles.flatMap(p=>p.skills)))].sort();
  const sid=name=>names.indexOf(name)+1;
  const jobs=fixture.jobCorpus.map(j=>({...j,description:j.domain_keywords.join(', '),skills:[...j.req_tech.map(n=>({skill_id:sid(n),is_required:true})),...[...j.pref_tech,...j.soft].map(n=>({skill_id:sid(n),is_required:false}))]}));
  const db=await database(); const rows=[];
  try {
    for(const student of fixture.studentProfiles){
      const profile={field_of_study:student.field,career_interests:student.interests,skill_ids:student.skills.map(sid)};
      const start=performance.now();const ranking=[];
      for(const job of jobs){const {rows:[{value}]}=await db.query('select public.score_compatibility($1,$2) value',[profile,job]);ranking.push({job_id:job.id,...value});}
      ranking.sort((a,b)=>b.match_score-a.match_score||a.job_id-b.job_id);
      const ids=ranking.map(j=>j.job_id);
      rows.push({profile_id:student.profile_id,ranking,metrics:metrics(ids,student.ground_truth,5),p3:metrics(ids,student.ground_truth,3).precision,p10:metrics(ids,student.ground_truth,10).precision,localSqlMs:performance.now()-start});
    }
    const output={generatedAt:new Date().toISOString(),environment:'Local PGlite PostgreSQL; no network or browser rendering',dataset:fixture.version,label:fixture.label,profiles:rows.length,jobs:jobs.length,
      engineSha256:crypto.createHash('sha256').update(fs.readFileSync('db/006_recommendation_rpc.sql')).digest('hex'),
      datasetSha256:crypto.createHash('sha256').update(fs.readFileSync('evaluation/fixtures-v1.json')).digest('hex'),
      summary:aggregate(rows.map(r=>r.metrics)),meanP3:rows.reduce((s,r)=>s+r.p3,0)/rows.length,meanP10:rows.reduce((s,r)=>s+r.p10,0)/rows.length,rows};
    fs.mkdirSync('evaluation/results',{recursive:true});fs.writeFileSync('evaluation/results/synthetic-v1.json',JSON.stringify(output,null,2));
    console.log(JSON.stringify({...output,rows:undefined},null,2));
  } finally {await db.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
