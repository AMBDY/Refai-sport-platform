import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Users, Building, DollarSign, Activity, AlertTriangle,
  CheckCircle, XCircle, Clock, Eye, RefreshCw, TrendingUp,
  BarChart3, Globe, Lock, Server, Database, Zap
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PendingApproval {
  id: string;
  league_id: string;
  league_name: string;
  tier: 'starter' | 'pro' | 'elite';
  billing_cycle: 'monthly' | 'annual' | 'league_duration';
  amount: number;
  team_count: number;
  created_by_name: string;
  created_at: string;
}

interface PlatformStats {
  totalLeagues: number;
  activeLeagues: number;
  totalTeams: number;
  totalPlayers: number;
  activeMatches: number;
  monthlyRevenue: number;
  totalViewers: number;
}

interface LiveMatch {
  id: string;
  league_name: string;
  home_team: string;
  away_team: string;
  score: { home: number; away: number };
  minute: number;
  moderators: number;
  viewers: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export function SuperAdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "live" | "finance" | "security">("overview");

  const [stats, setStats] = useState<PlatformStats>({
    totalLeagues: 0,
    activeLeagues: 0,
    totalTeams: 0,
    totalPlayers: 0,
    activeMatches: 0,
    monthlyRevenue: 0,
    totalViewers: 0,
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);

    // Load platform stats
    const { data: leaguesData } = await supabase
      .from('leagues')
      .select('id, is_suspended');

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id');

    const { data: matchesData } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'live');

    if (leaguesData && teamsData && matchesData) {
      setStats({
        totalLeagues: leaguesData.length,
        activeLeagues: leaguesData.filter(l => !l.is_suspended).length,
        totalTeams: teamsData.length,
        totalPlayers: 0,
        activeMatches: matchesData.length,
        monthlyRevenue: 15780,
        totalViewers: 45623,
      });
    }

    // Load pending approvals
    const { data: approvalsData } = await supabase
      .from('league_approvals')
      .select(`
        id,
        league_id,
        subscription_tier,
        billing_cycle,
        amount,
        status,
        created_at,
        leagues (name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (approvalsData) {
      setPendingApprovals(approvalsData.map((a: any) => ({
        id: a.id,
        league_id: a.league_id,
        league_name: a.leagues?.name || 'Unknown',
        tier: a.subscription_tier,
        billing_cycle: a.billing_cycle,
        amount: a.amount,
        team_count: 0,
        created_by_name: 'User',
        created_at: a.created_at,
      })));
    }

    // Load live matches
    const { data: liveData } = await supabase
      .from('matches')
      .select(`
        id,
        home_score,
        away_score,
        current_minute,
        league_id,
        home_team_id,
        away_team_id,
        leagues (name),
        teams!matches_home_team_id_fkey (name),
        away_teams:teams!matches_away_team_id_fkey (name)
      `)
      .eq('status', 'live');

    if (liveData) {
      setLiveMatches(liveData.map((m: any) => ({
        id: m.id,
        league_name: m.leagues?.name || 'Unknown',
        home_team: m.teams?.name || 'Home',
        away_team: m.away_teams?.name || 'Away',
        score: { home: m.home_score, away: m.away_score },
        minute: m.current_minute || 0,
        moderators: 0,
        viewers: 0,
      })));
    }

    // Load security alerts
    const { data: alertsData } = await supabase
      .from('security_events')
      .select('*')
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsData) {
      setSecurityAlerts(alertsData.map((a: any) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        message: a.details || a.type,
        timestamp: a.created_at,
      })));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Approve league
  const approveLeague = async (approval: PendingApproval) => {
    const { error } = await supabase
      .from('league_approvals')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', approval.id);

    if (!error) {
      // Activate league
      await supabase
        .from('leagues')
        .update({ is_suspended: false })
        .eq('id', approval.league_id);

      setPendingApprovals((prev) => prev.filter((a) => a.id !== approval.id));
      toast.success(`Approved: ${approval.league_name}`);
    } else {
      toast.error("Failed to approve league");
    }
  };

  // Reject league
  const rejectLeague = async (approval: PendingApproval) => {
    const { error } = await supabase
      .from('league_approvals')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', approval.id);

    if (!error) {
      setPendingApprovals((prev) => prev.filter((a) => a.id !== approval.id));
      toast.success(`Rejected: ${approval.league_name}`);
    }
  };

  // Get tier badge
  const getTierBadge = (tier: PendingApproval['tier']) => {
    switch (tier) {
      case 'elite':
        return <Badge className="bg-yellow-500">ELITE</Badge>;
      case 'pro':
        return <Badge className="bg-purple-500">PRO</Badge>;
      default:
        return <Badge variant="secondary">STARTER</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-cyan-400" />
              Super Admin Control Center
            </CardTitle>
            <div className="flex gap-1">
              {(["overview", "approvals", "live", "finance", "security"] as const).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab)}
                  className="text-xs capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Platform Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                  <Building className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                  <div className="text-xl font-bold text-white">{stats.totalLeagues}</div>
                  <div className="text-[10px] text-slate-400">Leagues</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                  <Users className="h-4 w-4 mx-auto text-green-400 mb-1" />
                  <div className="text-xl font-bold text-white">{stats.totalTeams}</div>
                  <div className="text-[10px] text-slate-400">Teams</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                  <Activity className="h-4 w-4 mx-auto text-red-400 mb-1" />
                  <div className="text-xl font-bold text-white">{stats.activeMatches}</div>
                  <div className="text-[10px] text-slate-400">Live Now</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                  <DollarSign className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
                  <div className="text-xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">Monthly</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center justify-start"
                  onClick={() => setActiveTab("approvals")}
                >
                  <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                  {pendingApprovals.length} Pending Approvals
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center justify-start"
                  onClick={() => setActiveTab("live")}
                >
                  <Activity className="h-4 w-4 mr-2 text-red-400" />
                  {liveMatches.length} Live Matches
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center justify-start"
                  onClick={() => setActiveTab("finance")}
                >
                  <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                  View Finance Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Lock className="h-4 w-4 mr-2 text-red-400" />
                  {securityAlerts.length} Security Alerts
                </Button>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <Server className="h-4 w-4 mx-auto text-green-400 mb-1" />
                  <div className="text-xs text-green-400">Systems Online</div>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <Database className="h-4 w-4 mx-auto text-green-400 mb-1" />
                  <div className="text-xs text-green-400">Database Healthy</div>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <Globe className="h-4 w-4 mx-auto text-green-400 mb-1" />
                  <div className="text-xs text-green-400">CDN Active</div>
                </div>
              </div>
            </>
          )}

          {/* Approvals Tab */}
          {activeTab === "approvals" && (
            <div className="space-y-2">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No pending approvals</p>
                </div>
              ) : (
                pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-white">{approval.league_name}</div>
                      {getTierBadge(approval.tier)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span>{approval.billing_cycle}</span>
                      <span>•</span>
                      <span className="text-green-400 font-bold">${approval.amount}/mo</span>
                      <span>•</span>
                      <span>Requested: {new Date(approval.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-500"
                        onClick={() => approveLeague(approval)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-500"
                        onClick={() => rejectLeague(approval)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Live Matches Tab */}
          {activeTab === "live" && (
            <div className="space-y-2">
              {liveMatches.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No live matches</p>
                </div>
              ) : (
                liveMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">
                        {match.league_name}
                      </Badge>
                      <Badge className="animate-pulse bg-red-500">
                        {match.minute}'
                      </Badge>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      {match.home_team} {match.score.home} - {match.score.away} {match.away_team}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{match.moderators} moderators</span>
                      <span>•</span>
                      <span>{match.viewers} viewers</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-2">
                      <Eye className="h-3 w-3 mr-1" />
                      View Match
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === "finance" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Monthly Revenue</div>
                  <div className="text-2xl font-bold text-green-400">${stats.monthlyRevenue.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Active Subscriptions</div>
                  <div className="text-2xl font-bold text-white">{stats.activeLeagues}</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-2">Revenue Breakdown</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                  <span>Elite Tier</span>
                  <span className="text-yellow-400">$9,570</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                  <span>Pro Tier</span>
                  <span className="text-purple-400">$4,280</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                  <span>Starter Tier</span>
                  <span className="text-slate-400">$1,930</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-2">
              {securityAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No security alerts</p>
                </div>
              ) : (
                securityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'critical'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-orange-500 bg-orange-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                      }`} />
                      <span className="text-sm text-white capitalize">{alert.type.replace('_', ' ')}</span>
                      <Badge
                        variant="destructive"
                        className="text-[10px]"
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300">{alert.message}</p>
                    <span className="text-[10px] text-slate-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
