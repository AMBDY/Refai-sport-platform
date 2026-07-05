import { createFileRoute, Link } from '@tanstack/react-router';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { PlayerRegistrationForm } from '@/components/onboarding/PlayerRegistrationForm';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dashboard/team/players/register')({
  component: RegisterPlayerPage,
});

function RegisterPlayerPage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Register Player</h1>
            <p className="text-muted-foreground">
              Add players, photos, videos and squad details.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/team">Back to dashboard</Link>
          </Button>
        </div>

        <PlayerRegistrationForm teamId={(teams?.[0] as any)?.id ?? null} />
      </div>
    </RoleGuard>
  );
}
