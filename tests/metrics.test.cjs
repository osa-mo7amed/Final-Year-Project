const {test}=require('node:test'),assert=require('node:assert/strict');
const {metrics,aggregate}=require('../evaluation/metrics');
test('ranking metrics use full relevant corpus and macro F1',()=>{
  const m=metrics([1,2,3,4],[1,3,5],3);
  assert.equal(m.precision,2/3);assert.equal(m.recall,2/3);assert.equal(m.ap,(1+2/3)/3);
  assert.deepEqual(metrics([1],[],5),{precision:0,recall:0,f1:0,ap:0});
  assert.equal(metrics([1],[1],5).precision,0.2);
  assert.equal(aggregate([m,metrics([1],[],5)]).f1,m.f1/2);
  assert.throws(()=>metrics([1,1],[1],5));assert.throws(()=>metrics([],[],0));
});
