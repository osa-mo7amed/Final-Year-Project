function sus(answers){
  if(!Array.isArray(answers)||answers.length!==10||answers.some(a=>!Number.isInteger(a)||a<1||a>5))throw new Error('Ten integer responses from 1 to 5 are required');
  return answers.reduce((sum,value,index)=>sum+(index%2===0?value-1:5-value),0)*2.5;
}
module.exports=sus;
