import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Heart, Play, Trophy } from 'lucide-react';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/viewer')({ component: ViewerDashboard });

function ViewerDashboard() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Fan Dashboard</h1>
          <p className="text-muted-foreground">Watch matches, follow teams, vote, chat and enjoy highlights.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><Play className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Live Matches</p><p className="text-sm text-muted-foreground">Watch ongoing games.</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Trophy className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Predictions</p><p className="text-sm text-muted-foreground">Predict scores and cards.</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Heart className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Following</p><p className="text-sm text-muted-foreground">Favorite teams and players.</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Bell className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Notifications</p><p className="text-sm text-muted-foreground">Goals and match alerts.</p></CardContent></Card>
        </div>

        <Section title="Continue Watching" />
        <Section title="Live Matches" />
        <Section title="Upcoming Matches" />
        <Section title="Highlights" />

        <Card>
          <CardHeader><CardTitle>Fan Interaction</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {['Man of the Match','Predict Score','Predict Next Goal','Predict Cards','Polls','Trivia'].map((item) => <Button key={item} variant="outline">{item}</Button>)}
          </CardContent>
        </Card>

        <Button asChild><Link to="/help">Open Customer Care</Link></Button>
      </div>
    </RoleGuard>
  );
}

function Section({ title }: { title: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Content will appear here when matches and videos are available.</CardContent></Card>;
}
