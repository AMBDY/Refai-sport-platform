import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FollowingFeed } from "@/components/FollowingFeed";

export const Route = createFileRoute("/dashboard/")({ component: Overview });

function Overview() {
  const { user } = useAuth();
  const { data: leagues } = useQuery({
    queryKey: ["my-leagues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("leagues").select("id, name, slug, status").eq("owner_id", user!.id);
      return data ?? [];
    },
  });
  const { data: teams } = useQuery({
    queryKey: ["my-teams", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("id, name, slug").eq("owner_id", user!.id);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>My leagues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{leagues?.length ?? 0}</p>
            <Button asChild variant="link" className="px-0">
              <Link to="/dashboard/leagues">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>My teams</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{teams?.length ?? 0}</p>
            <Button asChild variant="link" className="px-0">
              <Link to="/dashboard/teams">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <FollowingFeed />
    </div>
  );
}
