import { getEventAction } from "@/features/events/actions";
import { listJourneysAction } from "@/features/journeys/actions/journeys";
import { JourneyList } from "@/features/journeys";
import { notFound } from "next/navigation";

interface JourneysPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Journey List Page - Server Component
 * Displays all journeys for an event with empty state or list view
 */
export default async function JourneysPage({ params }: JourneysPageProps) {
  const { eventId } = await params;

  // Fetch event and journeys in parallel
  const [eventResult, journeysResult] = await Promise.all([
    getEventAction(eventId),
    listJourneysAction(eventId),
  ]);

  if (!eventResult.success || !eventResult.event) {
    notFound();
  }

  const journeys = journeysResult.success ? journeysResult.data : [];

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <JourneyList journeys={journeys} event={eventResult.event} />
    </div>
  );
}
