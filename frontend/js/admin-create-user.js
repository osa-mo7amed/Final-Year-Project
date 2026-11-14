// Uses an isolated signup client so account creation never replaces the admin session.
document.getElementById('create-user-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=document.getElementById('create-user-btn');if(button.disabled)return;
  const form=event.target;if(!form.reportValidity())return;button.disabled=true;
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'internmatch-account-creation'}});
  try{
    const {data,error}=await client.auth.signUp({email:form.elements.newEmail.value.trim(),password:form.elements.newPassword.value,
      options:{emailRedirectTo:new URL('profile.html',location.href).href,data:{full_name:form.elements.newName.value.trim(),role:form.elements.newRole.value,field_of_study:form.elements.newField.value.trim()}}});
    if(error)throw error;
    if(data?.user?.identities?.length===0){showToast('This address may already be registered. No role changes were made.','info');return;}
    showToast(data.session?'Account created. Email confirmation is disabled in this environment.':'Account registration submitted. The user must verify their email before signing in.','success');
    form.reset();await fetchAdminUsers();
  }catch{showToast('Account could not be created. Check the fields and try again.','error');}
  finally{
    try {
      if((await client.auth.getSession()).data.session){
        const {error}=await client.auth.signOut();if(error)throw error;
      }
    } catch {showToast('Account request finished, but test-client sign out could not be confirmed. Reload before trying again.','error');}
    finally {button.disabled=false;}
  }
});
