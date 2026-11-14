// All production scores and explanations come from the same PostgreSQL RPC.
async function fetchRecommendations(userId) {
  const start = performance.now();
  const {data,error} = await supabaseClient.rpc('calculate_recommendations_for_user', {p_user_id:userId});
  const elapsed = performance.now()-start;
  if (error) throw new Error('Recommendations could not be loaded. Please retry.');
  window.internmatchLastRecommendationMs = elapsed;
  return (data || []).map(job => ({...job, match_score:Number(job.match_score),
    skills:[...(job.matched_skills || []),...(job.missing_skills || [])]}));
}
