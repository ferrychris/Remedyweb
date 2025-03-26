import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://rvpfogabdspmglexfzzf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cGZvZ2FiZHNwbWdsZXhmenpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NTkyNjUsImV4cCI6MjA1NjIzNTI2NX0.mxHEh5eSTkx_Szde7KVKzGbqdxqGK6Edbg3847hpDVk'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and ANON KEY are missing in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
