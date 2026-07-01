import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ClipboardList, GalleryVerticalEnd, Shirt, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { TeamRegistrationForm } from '@/components/onboarding/TeamRegistrationForm';
import { PlayerRegistrationForm } from '@/components/onboarding/PlayerRegistrationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/team')({ component: TeamDashboard });

function TeamDashboard() {
  const { user } = useAuth();
  const { data: teams } = useQuery({
    queryKey: ['team-registrations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('team_registrations').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Team Owner Dashboard</h1><p className="text-muted-foreground">Register teams from league invites, manage players, staff, jerseys, formations, tactics and media.</p></div>
        <div className="grid gap-4 md:grid-cols-4">{[['Squad', Users], ['Kits', Shirt], ['Matches', CalendarDays], ['Formations', GalleryVerticalEnd]].map(([title, Icon]: any) => <Card key={title}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{title} tools unlock after league approval.</p></CardContent></Card>)}</div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />My team registrations</CardTitle></CardHeader><CardContent className="space-y-3">{(teams ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No team yet. Use your league invite token below.</p> : teams!.map((team: any) => <div key={team.id} className="flex items-center justify-between rounded-md border p-3"><div><div className="font-medium">{team.team_name}</div><div className="text-sm text-muted-foreground">{team.short_name}</div></div><span className="rounded bg-muted px-2 py-1 text-xs capitalize">{team.status.replace(/_/g, ' ')}</span></div>)}</CardContent></Card>
        <TeamRegistrationForm />
        <PlayerRegistrationForm teamId={(teams?.[0] as any)?.id ?? null} />
      </div>
    </RoleGuard>
  );
}
