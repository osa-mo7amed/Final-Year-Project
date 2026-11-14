const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
async function database() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to authenticated,anon;
    grant execute on all functions in schema auth to authenticated,anon;`);
  for (const f of ['001_schema.sql','002_rls_policies.sql','003_seed_skills.sql','005_seed_skill_guidance.sql','006_recommendation_rpc.sql','007_security_and_writes.sql']) {
    await db.exec(fs.readFileSync(`db/${f}`,'utf8'));
  }
  return db;
}
async function actor(db,id,metadata={}) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,session_id:id,user_metadata:metadata})]);
  await db.exec(id ? 'set role authenticated' : 'set role anon');
}
module.exports = {database,actor};
