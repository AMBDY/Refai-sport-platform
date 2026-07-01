import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/viewer')({ component: Page });

function Page() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <Card>
        <CardHeader><CardTitle>Viewer Dashboard</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Watch matches, chat, vote, follow teams and use fan features.</p></CardContent>
      </Card>
    </RoleGuard>
  );
}
