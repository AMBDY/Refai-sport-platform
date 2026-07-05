import { createFileRoute } from '@tanstack/react-router';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dashboard/moderator')({
  component: ModeratorDashboard,
});

function ModeratorDashboard() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Operations Hub</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button>Start Match</Button>
              <Button variant="outline">Pause Match</Button>
              <Button variant="outline">Resume</Button>
              <Button variant="destructive">End Match</Button>
              <Button variant="destructive">Emergency Stop Broadcast</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Scoreboard</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-center md:grid-cols-3">
              <div>
                <p className="text-lg font-bold">Home Team</p>
                <p className="text-5xl font-black">0</p>
                <Button className="mt-3">Home Goal</Button>
              </div>

              <div className="flex items-center justify-center text-2xl font-bold">VS</div>

              <div>
                <p className="text-lg font-bold">Away Team</p>
                <p className="text-5xl font-black">0</p>
                <Button className="mt-3">Away Goal</Button>
              </div>
            </CardContent>
          </Card>

          <Panel title="Match Event Panel" items={[
            'Goal', 'Penalty', 'Yellow Card', 'Red Card', 'Second Yellow',
            'Corner', 'Free Kick', 'Offside', 'Foul', 'Injury',
            'Substitution', 'VAR Check', 'VAR Decision', 'Kickoff',
            'Half Time', 'Full Time', 'Custom Note'
          ]} />

          <Panel title="VAR Operations Center" items={[
            'Start VAR Review', 'Offside Check', 'Penalty Check',
            'Red Card Review', 'Possible Goal', 'Handball',
            'Goal Confirmed', 'Goal Cancelled', 'Penalty Awarded',
            'Penalty Cancelled', 'Play On'
          ]} />

          <Panel title="Broadcast Graphics Engine" items={[
            'Goal', 'Player Intro', 'Lineups', 'Formation', 'Possession',
            'Cards', 'Substitution', 'Sponsor', 'VAR', 'Statistics',
            'Half Time', 'Full Time', 'Announcement', 'Countdown'
          ]} />

          <Panel title="Replay Center" items={[
            'Play', 'Queue', 'Delete', 'Export', 'Slow Motion',
            'Multiple Angle', 'Create Highlight'
          ]} />

          <Panel title="Announcements" items={[
            'Match Delayed', 'Heavy Rain', 'Medical Emergency',
            'Power Failure', 'Technical Issue', 'Security Alert',
            'Evacuation', 'Custom Message'
          ]} />
        </main>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Operators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Commentators: 0 connected</p>
              <p>Camera Operators: 0 connected</p>
              <p>Replay Engine: Online</p>
              <p>Broadcast Engine: Online</p>
              <p>VAR Engine: Online</p>
              <p>Latency: Normal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incident Queue</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No pending incidents.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Moderator actions will appear here.
            </CardContent>
          </Card>
        </aside>
      </div>
    </RoleGuard>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Button key={item} variant="outline" size="sm">
            {item}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
