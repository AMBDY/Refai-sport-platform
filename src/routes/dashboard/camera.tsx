import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/camera')({ component: Page });

function Page() {
  return (
    <RoleGuard allow="camera_operator" requireApproved={false}>
      <Card>
        <CardHeader><CardTitle>Camera Operator Dashboard</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Browser camera, mobile camera, RTMP, IP cam and OBS feed preparation.</p></CardContent>
      </Card>
    </RoleGuard>
  );
}
