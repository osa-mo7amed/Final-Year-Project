-- Run via a privileged SQL connection on the verified project. All fixtures roll back.
begin;
insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values
 ('11111111-1234-4123-8123-111111111111','{"full_name":"InternMatch rollback test","role":"Admin"}',now()),
 ('22222222-1234-4123-8123-222222222222','{"full_name":"InternMatch rollback admin"}',now());
insert into auth.sessions(id,user_id) values
 ('11111111-1234-4123-8123-111111111111','11111111-1234-4123-8123-111111111111'),
 ('22222222-1234-4123-8123-222222222222','22222222-1234-4123-8123-222222222222');
update public.users set role='Admin' where id='22222222-1234-4123-8123-222222222222';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1234-4123-8123-111111111111","session_id":"11111111-1234-4123-8123-111111111111","user_metadata":{"role":"Admin"}}',true);
do $$ begin
 if public.is_admin() then raise exception 'FAIL metadata escalation'; end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'FAIL cross-user read'; end if;
 begin update public.users set role='Admin'; raise exception 'FAIL direct role update'; exception when insufficient_privilege then null; end;
 begin perform public.calculate_recommendations_for_user('22222222-1234-4123-8123-222222222222'); raise exception 'FAIL cross-user RPC'; exception when insufficient_privilege then null; end;
 perform public.save_profile('{"institution":"Rollback test","cgpa":0}','{}');
 if (select institution from public.profiles)<>'Rollback test' then raise exception 'FAIL profile save'; end if;
 begin perform public.save_profile('{"institution":"Broken"}',array[999999999::bigint]); raise exception 'FAIL invalid skill accepted'; exception when foreign_key_violation then null; end;
 if (select institution from public.profiles)<>'Rollback test' then raise exception 'FAIL atomic save'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-1234-4123-8123-222222222222","session_id":"22222222-1234-4123-8123-222222222222"}',true);
do $$ declare jid bigint; begin
 if not public.is_admin() then raise exception 'FAIL database admin'; end if;
 begin perform public.admin_update_user(auth.uid(),'Test','Student','Active'); raise exception 'FAIL self lockout'; exception when invalid_parameter_value then null; end;
 jid:=public.save_job(null,'{"title":"Rollback fixture","company":"Synthetic","description":"Test only","location":"Remote","job_type":"Internship","status":"Active"}','[]');
 perform public.archive_job(jid);
 if (select status from public.job_postings where job_posting_id=jid)<>'Closed' then raise exception 'FAIL archive'; end if;
 perform public.admin_update_user('11111111-1234-4123-8123-111111111111','Inactive test','Student','Inactive');
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1234-4123-8123-111111111111","session_id":"11111111-1234-4123-8123-111111111111"}',true);
do $$ begin
 if (select count(*) from public.profiles)<>0 then raise exception 'FAIL inactive read'; end if;
 begin perform public.save_profile('{}','{}'); raise exception 'FAIL inactive write'; exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.users; raise exception 'FAIL anonymous read'; exception when insufficient_privilege then null; end;
 begin perform public.calculate_recommendations_for_user('11111111-1234-4123-8123-111111111111'); raise exception 'FAIL anonymous RPC'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: live SQL role simulation, synthetic fixtures rolled back' as result;
