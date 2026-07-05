import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, Trophy, Users, Wallet, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type StatusAction = 'approved' | 'rejected' | 'changes_requested' | 'suspended';

export function SuperAdminDashboard() {
  return (
    <RoleGuard allow="super_admin" requireApproved>
      <SuperAdminControl />
    </RoleGuard>
  );
}

function SuperAdminControl() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const leaguesQ = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => {
      const { data, error } = await supabase.from('league_registrations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const teamsQ = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_registrations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const walletsQ = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('league_wallets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateLeague = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAction }) => {
      const { error } = await supabase.from('league_registrations').update({
        status,
        review_note: note || null,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;

      if (status === 'approved') {
        const { data: league } = await supabase.from('league_registrations').select('id, owner_id').eq('id', id).maybeSingle();
        if (league) {
          await supabase.from('league_wallets').upsert({
            league_registration_id: league.id,
            owner_id: league.owner_id,
            currency: 'NGN',
          }, { onConflict: 'league_registration_id' });
        }
      }
    },
    onSuccess: () => {
      toast.success('League updated');
      qc.invalidateQueries({ queryKey: ['admin-leagues'] });
      qc.invalidateQueries({ queryKey: ['admin-wallets'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'League update failed'),
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAction }) => {
      const { error } = await supabase.from('team_registrations').update({
        status,
        review_note: note || null,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team updated');
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Team update failed'),
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, account_status }: { id: string; account_status: string }) => {
      const { error } = await supabase.from('profiles').update({ account_status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async ({ table, id }: { table: 'league_registrations' | 'team_registrations'; id: string }) => {
      if (!window.confirm('Delete this record permanently?')) return;
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['admin-leagues'] });
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    },
  });

  <Card>
  <CardHeader>
    <CardTitle>League Edit Approvals</CardTitle>
  </CardHeader>

  <CardContent>
    {/* list pending league_edit_requests here */}
  </CardContent>
</Card>

  return (
    <div className="min-h-screen bg-[#07130d] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-emerald-900 bg-[#0b1711] p-6">
          <div className="flex items-center gap-2 text-emerald-300"><Shield /> Super Admin Control Center</div>
          <h1 className="mt-2 text-3xl font-bold">Platform command dashboard</h1>
          <p className="text-emerald-50/80">Approve, reject, suspend, delete, monitor wallets, and control platform activity.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={Users} label="Users" value={usersQ.data?.length ?? 0} />
          <Metric icon={Trophy} label="Leagues" value={leaguesQ.data?.length ?? 0} />
          <Metric icon={Users} label="Teams" value={teamsQ.data?.length ?? 0} />
          <Metric icon={Wallet} label="Wallets" value={walletsQ.data?.length ?? 0} />
        </div>

        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note for approvals, rejections, suspensions or requested changes" className="bg-slate-950 text-white" />

        <Tabs defaultValue="leagues">
          <TabsList className="grid grid-cols-4 bg-slate-950">
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
          </TabsList>

          <TabsContent value="leagues">
            {(leaguesQ.data ?? []).map((l: any) => (
              <Row key={l.id} title={l.league_name} subtitle={l.owner_email} status={l.status}>
                <Button onClick={() => updateLeague.mutate({ id: l.id, status: 'approved' })}>Approve</Button>
                <Button variant="outline" onClick={() => updateLeague.mutate({ id: l.id, status: 'changes_requested' })}>Request changes</Button>
                <Button variant="secondary" onClick={() => updateLeague.mutate({ id: l.id, status: 'suspended' })}>Suspend</Button>
                <Button variant="destructive" onClick={() => updateLeague.mutate({ id: l.id, status: 'rejected' })}>Reject</Button>
                <Button variant="destructive" onClick={() => deleteRecord.mutate({ table: 'league_registrations', id: l.id })}><Trash2 className="h-4 w-4" /></Button>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="teams">
            {(teamsQ.data ?? []).map((t: any) => (
              <Row key={t.id} title={t.team_name} subtitle={t.owner_email} status={t.status}>
                <Button onClick={() => updateTeam.mutate({ id: t.id, status: 'approved' })}>Approve</Button>
                <Button variant="outline" onClick={() => updateTeam.mutate({ id: t.id, status: 'changes_requested' })}>Request edits</Button>
                <Button variant="secondary" onClick={() => updateTeam.mutate({ id: t.id, status: 'suspended' })}>Suspend</Button>
                <Button variant="destructive" onClick={() => updateTeam.mutate({ id: t.id, status: 'rejected' })}>Reject</Button>
                <Button variant="destructive" onClick={() => deleteRecord.mutate({ table: 'team_registrations', id: t.id })}><Trash2 className="h-4 w-4" /></Button>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="users">
            {(usersQ.data ?? []).map((u: any) => (
              <Row key={u.id} title={u.email} subtitle={u.role} status={u.account_status}>
                <Button onClick={() => updateUser.mutate({ id: u.id, account_status: 'approved' })}>Approve</Button>
                <Button variant="secondary" onClick={() => updateUser.mutate({ id: u.id, account_status: 'suspended' })}>Suspend</Button>
                <Button variant="destructive" onClick={() => updateUser.mutate({ id: u.id, account_status: 'rejected' })}>Reject</Button>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="wallets">
            {(walletsQ.data ?? []).map((w: any) => (
              <Row key={w.id} title={`Wallet ${w.id.slice(0, 8)}`} subtitle={w.owner_id} status={`NGN ${w.ledger_balance}`} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <Card className="border-emerald-900 bg-slate-950 text-white"><CardContent className="p-4"><Icon className="mb-2 h-5 w-5 text-emerald-300" /><div className="text-2xl font-bold">{value}</div><div className="text-xs text-slate-400">{label}</div></CardContent></Card>;
}

function Row({ title, subtitle, status, children }: { title: string; subtitle: string; status: string; children?: React.ReactNode }) {
  return <div className="my-3 rounded-lg border border-emerald-900 bg-slate-950 p-4"><div className="font-semibold text-white">{title}</div><div className="text-sm text-slate-400">{subtitle}</div><Badge className="my-3 capitalize">{status?.replace?.(/_/g, ' ') ?? status}</Badge><div className="flex flex-wrap gap-2">{children}</div></div>;
}
