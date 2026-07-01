import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/moderator')({ component: Page });

function Page() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <Card>
        <CardHeader><CardTitle>Moderator Dashboard</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Live match control, score updates, graphics, replay and VAR tools.</p></CardContent>
      </Card>
    </RoleGuard>
  );
}
