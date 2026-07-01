import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/commentator')({ component: Page });

function Page() {
  return (
    <RoleGuard allow="commentator" requireApproved={false}>
      <Card>
        <CardHeader><CardTitle>Commentator Dashboard</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Browser mic, audio mixer, studio input and synchronized commentary tools.</p></CardContent>
      </Card>
    </RoleGuard>
  );
}
