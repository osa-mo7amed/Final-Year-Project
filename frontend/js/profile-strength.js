(function(root){
  function profileStrength(profile,skills) {
    const present=value=>String(value??'').trim()!=='';
    const technical=new Set(skills.filter(s=>s.category==='Technical').map(s=>s.skill_id)).size;
    const soft=new Set(skills.filter(s=>s.category==='Soft').map(s=>s.skill_id)).size;
    return 15+(present(profile.institution)?7:0)+(present(profile.programme)?6:0)+(present(profile.field_of_study)?6:0)
      +(present(profile.cgpa)&&Number(profile.cgpa)>=0&&Number(profile.cgpa)<=4?6:0)
      +(technical>=3?25:technical===2?18:technical===1?10:0)+(soft>=2?15:soft===1?8:0)
      +(present(profile.career_interests)?10:0)+(present(profile.certifications)?10:0);
  }
  if(typeof module!=='undefined')module.exports=profileStrength;else root.profileStrength=profileStrength;
})(globalThis);
