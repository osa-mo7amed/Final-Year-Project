// ============================================================================
// InternMatch — Supabase Client Configuration
// The anon/public key is SAFE to expose in frontend code — it is designed for
// this purpose. All real data protection happens via Row-Level Security
// policies (db/002_rls_policies.sql), enforced server-side by Postgres.
// NEVER put the service_role key here or in any frontend file.
// ============================================================================

const SUPABASE_URL = 'https://uszwimitxmzqwtqlugxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzendpbWl0eG16cXd0cWx1Z3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjcyMzgsImV4cCI6MjEwMzMwMzIzOH0.U-xI7B-q6SXEMtpLJ1FCen7zupAG_BssFtavJ91j-Oc';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
