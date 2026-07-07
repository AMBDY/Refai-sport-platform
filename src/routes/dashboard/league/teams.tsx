import { createFileRoute, Link } from '@tanstack/react-router';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/league/teams')({
  component: LeagueTeamsPage,
});

function LeagueTeamsPage() {
  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">League Teams</h1>
            <p className="text-muted-foreground">
              This is the teams page. If you can see this, routing is working.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teams Page Opened Successfully</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Now you can replace this test content with the full teams management content.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
