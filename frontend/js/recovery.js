document.getElementById('recovery-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=document.getElementById('submit-btn');if(button.disabled)return;
  const box=document.getElementById('form-alert');button.disabled=true;
  try{
    const password=document.getElementById('password').value;
    if(password.length<8)throw new Error('Use at least 8 characters.');
    if(password!==document.getElementById('confirmPassword').value)throw new Error('Passwords do not match.');
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session)throw new Error('Open a valid password recovery link from your email first.');
    const {error}=await supabaseClient.auth.updateUser({password});if(error)throw new Error('Password could not be changed. Request a new recovery link.');
    try {
      const {error:signOutError}=await supabaseClient.auth.signOut();
      if(signOutError)throw signOutError;
    } catch {
      showAlert(box,'Password changed, but sign out failed. Your session may still be active; sign out from your dashboard before leaving this device.','error');
      return;
    }
    showAlert(box,'Password changed. You can now sign in.','success');
  }catch(err){showAlert(box,err.message);}finally{button.disabled=false;}
});
