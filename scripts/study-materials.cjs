const fs=require('node:fs');
const fixture=require('../evaluation/fixtures-v1.json');
const csv=rows=>rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
fs.mkdirSync('evaluation/study',{recursive:true});
// Stable permutation unrelated to scores. All 120 pairs are included to support recall and MAP.
const pairs=fixture.studentProfiles.flatMap(p=>fixture.jobCorpus.map(j=>({p,j,key:((Number(p.profile_id.slice(1))*17+j.id*37)%127)}))).sort((a,b)=>a.key-b.key||a.p.profile_id.localeCompare(b.p.profile_id)||a.j.id-b.j.id);
fs.writeFileSync('evaluation/study/blind-relevance.csv',csv([['judge_code','profile_id','job_id','field','profile_skills','interests','job_title','industry','job_description','required_skills','preferred_skills','relevant_0_or_1','reason'],...pairs.map(({p,j})=>['',p.profile_id,j.id,p.field,p.skills.join('; '),p.interests,j.title,j.industry,j.domain_keywords.join(', '),j.req_tech.join('; '),[...j.pref_tech,...j.soft].join('; '),'',''])]));
// Header-only response templates; never overwrite collected responses with this generator.
for(const [file,headers]of Object.entries({'sus-responses.csv':['participant_code','date',...Array.from({length:10},(_,i)=>'q'+(i+1)),'comments'], 'task-observations.csv':['participant_code','task_id','completed_yes_no','seconds','assistance','error_observed','comment']})){
 const path='evaluation/study/'+file;if(!fs.existsSync(path))fs.writeFileSync(path,csv([headers]));
}
console.log('Generated blank study templates and 120 blind profile/job pairs. No judgments or responses collected.');
