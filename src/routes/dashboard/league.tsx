import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Broadcast, CalendarDays, ClipboardList, Landmark, Settings, ShieldCheck, Trophy, Users, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { LeagueRegistrationForm } from '@/components/onboarding/LeagueRegistrationForm';
import { InviteManager } from '@/components/onboarding/InviteManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/league')({ component: LeagueDashboard });

const modules = [
  ['Overview', Trophy, 'Summary, upcoming matches, finances and live matches'],
  ['Teams', Users, 'Registered, pending and rejected teams'],
  ['Matches', CalendarDays, 'Fixtures, schedules, standings and brackets'],
  ['Wallet', Wallet, 'Balance, payments, taxes and settlement logs'],
  ['Moderators', ShieldCheck, 'Assign moderators and permissions'],
  ['Broadcast', Broadcast, 'Cameras, commentators, overlays and graphics'],
  ['Rules', ClipboardList, 'Manage rules and AI enforcement'],
  ['Settings', Settings, 'Branding, automation and AI features'],
] as const;

function LeagueDashboard() {
  const { user } = useAuth();
  const { data: leagues } = useQuery({
    queryKey: ['league-registrations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('league_registrations').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">League Owner Dashboard</h1><p className="text-muted-foreground">Register leagues, manage teams, wallets, broadcasts, moderators, rules, branding and automation.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{modules.map(([title, Icon, desc]) => <Card key={title}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{desc}</p></CardContent></Card>)}</div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" />My leagues</CardTitle></CardHeader><CardContent className="space-y-3">{(leagues ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No league yet.</p> : leagues!.map((league: any) => <div key={league.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{league.league_name}</div><div className="text-sm text-muted-foreground">{league.sport_type} / {league.competition_type}</div></div><span className="rounded bg-muted px-2 py-1 text-xs capitalize">{league.status.replace(/_/g, ' ')}</span></div>)}</CardContent></Card>
        <InviteManager leagueId={(leagues?.[0] as any)?.id ?? null} />
        <LeagueRegistrationForm />
      </div>
    </RoleGuard>
  );
}
