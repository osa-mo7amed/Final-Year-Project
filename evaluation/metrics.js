(function(root){
  function metrics(ranking,relevant,k=5) {
    if(!Number.isInteger(k)||k<1) throw new Error('K must be a positive integer');
    if(new Set(ranking).size!==ranking.length) throw new Error('Duplicate ranked job');
    const rel=new Set(relevant); let hits=0,ap=0;
    ranking.forEach((id,index)=>{if(rel.has(id)){hits++;ap+=hits/(index+1);}});
    const top=ranking.slice(0,k).filter(id=>rel.has(id)).length;
    const precision=top/k,recall=rel.size?top/rel.size:0;
    return {precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0,ap:rel.size?ap/rel.size:0};
  }
  function aggregate(rows) {
    if(!rows.length) throw new Error('No evaluation rows');
    return Object.fromEntries(['precision','recall','f1','ap'].map(key=>[key,rows.reduce((s,r)=>s+r[key],0)/rows.length]));
  }
  const api={metrics,aggregate}; if(typeof module!=='undefined')module.exports=api;else root.InternMatchMetrics=api;
})(globalThis);
