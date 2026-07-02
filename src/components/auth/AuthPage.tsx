import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Building2, Camera, Headphones, Megaphone, Shield, Trophy, UserRound, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { dashboardForRole, inviteOnlyRoles, publicSignupRoles, roleLabels, type UserRole } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const roleCards = [
  { role: 'league_owner', icon: Trophy, desc: 'Register leagues, manage teams, run competitions and finances.' },
  { role: 'team_owner', icon: Users, desc: 'Register teams, manage players, kits, formations and lineups.' },
  { role: 'coach', icon: UserRound, desc: 'View squad, edit tactics and build formations.' },
  { role: 'moderator', icon: Megaphone, desc: 'Control live matches, scores, graphics, replays and VAR.' },
  { role: 'camera_operator', icon: Camera, desc: 'Connect cameras, RTMP, OBS and stream feeds.' },
  { role: 'commentator', icon: Headphones, desc: 'Connect audio and provide live commentary.' },
  { role: 'viewer', icon: UserRound, desc: 'Watch matches, chat, vote and follow teams.' },
  { role: 'sponsor', icon: Building2, desc: 'Manage ads and sponsor broadcasts.' },
] as const;

export function AuthPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', inviteToken: '' });

  const selectedCard = useMemo(() => roleCards.find((card) => card.role === selectedRole), [selectedRole]);
  const inviteOnly = selectedRole ? inviteOnlyRoles.includes(selectedRole) : false;
  const publicRole = selectedRole ? publicSignupRoles.includes(selectedRole) : false;

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
  e.preventDefault();

  if (mode === 'signup' && !selectedRole) {
    return toast.error('Choose a role first');
  }

  if (mode === 'signup' && selectedRole === 'super_admin') {
    return toast.error('Super Admin accounts are created internally only');
  }

  if (
    mode === 'signup' &&
    selectedRole &&
    inviteOnlyRoles.includes(selectedRole) &&
    !form.inviteToken.trim()
  ) {
    return toast.error('This role requires a secure invite token');
  }

  setLoading(true);

  try {
    if (mode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile?.role) {
        toast.error('Account profile not found. Contact support.');
        return;
      }

      navigate({ to: dashboardForRole(profile.role) as never });
      return;
    }

    const displayName = (form.firstName + ' ' + form.lastName).trim();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          display_name: displayName,
          phone: form.phone,
          role: selectedRole,
          invite_token: form.inviteToken || null,
        },
      },
    });
      if (error) throw error;
      if (!data.user) throw new Error('Signup did not return a user');

      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        display_name: displayName,
        email: form.email,
        phone: form.phone,
        role: selectedRole,
        account_status: selectedRole === 'viewer' ? 'approved' : 'pending_verification',
        mfa_enabled: false,
      });

      if (!data.session) {
      toast.success('Account created. Please confirm your email, then sign in.');
      setMode('signin');
      return;
      }

      toast.success('Account created. Continue onboarding.');
      navigate({ to: dashboardForRole(selectedRole) as never });
      } catch (err) {
      console.error('Auth error:', err);
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Choose Your Role</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Select what you are registering for. Refai creates the correct account type and sends you to the right onboarding dashboard.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roleCards.map(({ role, icon: Icon, desc, internal }) => {
            const locked = internal || inviteOnlyRoles.includes(role);
            return (
              <button type="button" key={role} onClick={() => setSelectedRole(role)} className={'rounded-lg border bg-card p-5 text-left transition hover:border-primary ' + (selectedRole === role ? 'border-primary ring-2 ring-primary/20' : '')}>
                <div className="flex items-start justify-between gap-3"><Icon className="h-6 w-6 text-primary" />{locked && <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{internal ? 'Internal' : 'Invite'}</span>}</div>
                <h2 className="mt-4 font-semibold">{roleLabels[role]}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </button>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>{selectedCard ? (mode === 'signup' ? 'Create ' : 'Sign in to ') + roleLabels[selectedCard.role] : 'Select a role'}</CardTitle></CardHeader>
          <CardContent>
            {!selectedRole ? <p className="text-sm text-muted-foreground">Pick a card to continue.</p> : selectedRole === 'super_admin' ? <p className="text-sm text-muted-foreground">Super Admin accounts are not publicly created.</p> : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1"><Button type="button" variant={mode === 'signup' ? 'default' : 'ghost'} onClick={() => setMode('signup')}>Sign up</Button><Button type="button" variant={mode === 'signin' ? 'default' : 'ghost'} onClick={() => setMode('signin')}>Sign in</Button></div>
                {mode === 'signup' && <><div className="grid grid-cols-2 gap-3"><div><Label>First name</Label><Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required /></div><div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required /></div></div><div><Label>Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></div></>}
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></div>
                <div><Label>Password</Label><Input type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required /></div>
                {mode === 'signup' && inviteOnly && <div><Label>Invite token</Label><Input value={form.inviteToken} onChange={(e) => update('inviteToken', e.target.value)} required /></div>}
                {mode === 'signup' && publicRole && selectedRole !== 'viewer' && <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">This role requires verification and approval before full tools unlock.</p>}
                <Button className="w-full" disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
