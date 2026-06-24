// Auth attacher - simplified for client-side
import { supabase } from './client';

export async function attachSupabaseAuth() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
