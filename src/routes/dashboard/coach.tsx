import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/coach')({ component: Page });

function Page() {
  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <Card>
        <CardHeader><CardTitle>Coach Dashboard</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Squad viewing, tactics editing, formation building and lineup preparation.</p></CardContent>
      </Card>
    </RoleGuard>
  );
}
