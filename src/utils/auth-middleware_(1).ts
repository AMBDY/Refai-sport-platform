// Auth middleware - simplified for client-side
import { supabase } from './client';

export async function requireSupabaseAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("Unauthorized: No active session");
  }
  return {
    supabase,
    userId: data.session.user.id,
    claims: data.session.user.app_metadata,
  };
}
