import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'league_owner' | 'team_owner' | 'coach' | 'moderator' | 'viewer' | 'camera_operator' | 'commentator';

type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: UserRole;
  account_status: 'pending' | 'approved' | 'suspended';
  created_at: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);
        }
      });
  }, [user]);

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Super admin has access to everything
    if (profile.role === 'super_admin') return true;

    return roles.includes(profile.role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    hasRole,
    signOut,
  };
}
