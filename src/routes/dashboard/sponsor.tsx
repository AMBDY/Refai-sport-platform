import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/sponsor')({ component: Page });

function Page() {
  return (
    <RoleGuard allow="sponsor" requireApproved={false}>
      <Card>
        <CardHeader><CardTitle>Sponsor Dashboard</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Ad assets, campaign placements, sponsored broadcast graphics and performance reports.</p></CardContent>
      </Card>
    </RoleGuard>
  );
}
