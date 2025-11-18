import { getEventAction } from "@/features/events";
import { notFound } from "next/navigation";

interface ResultsPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Results page for event analytics and metrics
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 * Currently shows placeholder analytics data
 */
export default async function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = await params;
  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  const event = result.event;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Event Analytics</h1>
        <p className="text-muted-foreground">
          Track performance and engagement metrics for your event
        </p>
      </div>

      {/* Placeholder metrics cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Sessions"
          value={event.sessionsCount?.toString() ?? "0"}
          description="Total number of guest sessions"
        />
        <MetricCard
          label="Ready Sessions"
          value={event.readyCount?.toString() ?? "0"}
          description="Sessions with completed results"
        />
        <MetricCard
          label="Shares"
          value={event.sharesCount?.toString() ?? "0"}
          description="Times content was shared"
        />
        <MetricCard
          label="Conversion Rate"
          value={
            event.sessionsCount > 0
              ? `${Math.round((event.readyCount / event.sessionsCount) * 100)}%`
              : "0%"
          }
          description="Session completion rate"
        />
      </div>

      {/* Placeholder for future charts and detailed analytics */}
      <div className="border rounded-lg p-8 bg-muted/50">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Detailed Analytics Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Advanced analytics including engagement trends, top-performing experiences,
            and demographic insights will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
}

function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <div className="border rounded-lg p-6 space-y-2 bg-card">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
