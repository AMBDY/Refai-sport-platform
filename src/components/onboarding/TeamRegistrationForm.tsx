import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function TeamRegistrationForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const inviteToken = String(fd.get('invite_token') || '');
      const { data: invite, error: inviteError } = await supabase.from('team_invites').select('*').eq('token', inviteToken).maybeSingle();
      if (inviteError) throw inviteError;
      if (!invite) throw new Error('Invalid invite token');
      const jerseys = { home: { shirt_front: fd.get('home_shirt_front'), shirt_back: fd.get('home_shirt_back'), shorts: fd.get('home_shorts'), socks: fd.get('home_socks'), colors: fd.get('home_colors') }, away: { shirt_front: fd.get('away_shirt_front'), shirt_back: fd.get('away_shirt_back'), shorts: fd.get('away_shorts'), socks: fd.get('away_socks'), colors: fd.get('away_colors') }, third: { shirt_front: fd.get('third_shirt_front'), shirt_back: fd.get('third_shirt_back'), shorts: fd.get('third_shorts'), socks: fd.get('third_socks'), colors: fd.get('third_colors') } };
      const payload = { league_registration_id: invite.league_registration_id, invite_id: invite.id, owner_id: user.id, status: 'pending_approval', team_name: String(fd.get('team_name') || ''), short_name: String(fd.get('short_name') || ''), logo_url: String(fd.get('logo_url') || ''), badge_url: String(fd.get('badge_url') || ''), banner_url: String(fd.get('banner_url') || ''), motto: String(fd.get('motto') || ''), description: String(fd.get('description') || ''), owner_name: String(fd.get('owner_name') || ''), owner_email: String(fd.get('owner_email') || user.email || ''), owner_phone: String(fd.get('owner_phone') || ''), head_coach: String(fd.get('head_coach') || ''), assistant_coach: String(fd.get('assistant_coach') || ''), team_manager: String(fd.get('team_manager') || ''), medical_staff: String(fd.get('medical_staff') || ''), sponsor_logos: String(fd.get('sponsor_logos') || '').split('\n').filter(Boolean), jerseys, home_ground: String(fd.get('home_ground') || ''), training_ground: String(fd.get('training_ground') || '') };
      const { error } = await supabase.from('team_registrations').insert(payload);
      if (error) throw error;
      await supabase.from('team_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);
      toast.success('Team submitted for league owner approval');
      e.currentTarget.reset();
      qc.invalidateQueries({ queryKey: ['team-registrations'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not register team');
    } finally {
      setSaving(false);
    }
  }

  return <Card><CardHeader><CardTitle>Register Team From Invite</CardTitle></CardHeader><CardContent><form className="space-y-8" onSubmit={submit}><Section title="Invite"><Field name="invite_token" label="League Invite Token" required /></Section><Section title="Team Identity"><Field name="team_name" label="Team Name" required /><Field name="short_name" label="Short Name" required /><Field name="logo_url" label="Logo URL" /><Field name="badge_url" label="Badge URL" /><Field name="banner_url" label="Banner URL" /><Field name="motto" label="Motto" /><div className="md:col-span-2"><Label>Description</Label><Textarea name="description" rows={3} /></div></Section><Section title="Ownership"><Field name="owner_name" label="Team Owner Name" required /><Field name="owner_email" label="Email" type="email" required /><Field name="owner_phone" label="Phone" required /></Section><Section title="Staff"><Field name="head_coach" label="Head Coach" required /><Field name="assistant_coach" label="Assistant Coach" /><Field name="team_manager" label="Team Manager" required /><Field name="medical_staff" label="Medical Staff" /></Section><Section title="Branding"><div className="md:col-span-2"><Label>Sponsor Logo URLs, one per line</Label><Textarea name="sponsor_logos" rows={3} /></div></Section><Section title="Home Kit"><Field name="home_shirt_front" label="Shirt Front URL" required /><Field name="home_shirt_back" label="Shirt Back URL" required /><Field name="home_shorts" label="Shorts URL" required /><Field name="home_socks" label="Socks URL" required /><Field name="home_colors" label="Colors" required /></Section><Section title="Away Kit"><Field name="away_shirt_front" label="Shirt Front URL" required /><Field name="away_shirt_back" label="Shirt Back URL" required /><Field name="away_shorts" label="Shorts URL" required /><Field name="away_socks" label="Socks URL" required /><Field name="away_colors" label="Colors" required /></Section><Section title="Third Kit"><Field name="third_shirt_front" label="Shirt Front URL" /><Field name="third_shirt_back" label="Shirt Back URL" /><Field name="third_shorts" label="Shorts URL" /><Field name="third_socks" label="Socks URL" /><Field name="third_colors" label="Colors" /></Section><Section title="Team Venue"><Field name="home_ground" label="Home Ground" /><Field name="training_ground" label="Training Ground" /></Section><Button disabled={saving}>{saving ? 'Submitting...' : 'Submit team for approval'}</Button></form></CardContent></Card>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="mb-3 font-semibold">{title}</h3><div className="grid gap-4 md:grid-cols-2">{children}</div></section>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) { const { label, ...inputProps } = props; return <div><Label>{label}</Label><Input {...inputProps} /></div>; }
