// Synthetic mock SDK extracted from retained browser harness; no live service.
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
      if(name==='calculate_recommendations_for_user')return {data:window.__empty?[]:(window.__jobs || [job]),error:null};
      if(name==='save_profile'){localStorage.setItem('savedProfile',JSON.stringify(args.p_profile));return {data:1,error:null};}
      return {data:1,error:null};
    }};
  window.supabase={createClient:()=>api};
}

module.exports={mockSDK};
