document.getElementById('run-eval-btn').addEventListener('click',async()=>{
  const btn=document.getElementById('run-eval-btn');btn.disabled=true;
  const body=document.getElementById('eval-table-body');body.textContent='Loading saved results…';
  try {
    const response=await fetch('../../evaluation/results/synthetic-v1.json');
    if(!response.ok)throw new Error('Run node evaluation/benchmark_accuracy.js first.');
    const report=await response.json();
    body.textContent='';
    for(const row of report.rows){
      const tr=document.createElement('tr');
      for(const value of [row.profile_id,'Synthetic fixture',row.ranking.slice(0,3).map(j=>j.match_score+'%').join(', '),
        (row.p3*100).toFixed(1)+'%',(row.metrics.precision*100).toFixed(1)+'%',(row.metrics.recall*100).toFixed(1)+'%',
        (row.metrics.ap*100).toFixed(1)+'%',row.localSqlMs.toFixed(2)+' ms']){
        const td=document.createElement('td');td.textContent=value;tr.append(td);
      }body.append(tr);
    }
    const values={'val-p3':report.meanP3,'val-p5':report.summary.precision,'val-r5':report.summary.recall,'val-f1':report.summary.f1,'val-map':report.summary.ap};
    for(const [id,value]of Object.entries(values))document.getElementById(id).textContent=(value*100).toFixed(1)+'%';
    document.getElementById('val-latency').textContent=(report.rows.reduce((s,r)=>s+r.localSqlMs,0)/report.rows.length).toFixed(2)+' ms';
  }catch(err){body.textContent=err.message;}finally{btn.disabled=false;}
});
