const {test}=require('node:test'),assert=require('node:assert/strict'),sus=require('../evaluation/sus.cjs');
test('SUS alternates contributions, validates missing and invalid answers',()=>{
  assert.equal(sus([5,1,5,1,5,1,5,1,5,1]),100);
  assert.equal(sus([1,5,1,5,1,5,1,5,1,5]),0);
  assert.equal(sus(Array(10).fill(3)),50);assert.throws(()=>sus([3]));assert.throws(()=>sus(Array(10).fill(0)));
});
