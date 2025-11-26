import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEventAction } from "@/features/events/actions";
import { getJourneyAction } from "@/features/journeys/actions/journeys";
import { JourneyEditor } from "@/features/journeys/components";

interface JourneyEditorPageProps {
  params: Promise<{ eventId: string; journeyId: string }>;
}

/**
 * Journey Editor Page - Server Component
 * Loads event and journey data, then renders the JourneyEditor client component.
 */
export default async function JourneyEditorPage({
  params,
}: JourneyEditorPageProps) {
  const { eventId, journeyId } = await params;

  // Fetch event and journey in parallel
  const [eventResult, journeyResult] = await Promise.all([
    getEventAction(eventId),
    getJourneyAction(eventId, journeyId),
  ]);

  if (!eventResult.success || !journeyResult.success) {
    notFound();
  }

  // TypeScript narrowing after success check
  const event = eventResult.event!;
  const journey = journeyResult.data;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      }
    >
      <JourneyEditor event={event} journey={journey} />
    </Suspense>
  );
}
