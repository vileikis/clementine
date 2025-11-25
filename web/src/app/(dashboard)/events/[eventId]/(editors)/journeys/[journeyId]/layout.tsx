import { getEventAction } from "@/features/events/actions"
import { getJourneyAction } from "@/features/journeys/actions/journeys"
import { notFound } from "next/navigation"
import { EditorHeader } from "@/components/shared"

interface JourneyEditorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string; journeyId: string }>;
}

/**
 * Journey Editor Layout
 * Fullscreen editor with minimal header and breadcrumbs
 */
export default async function JourneyEditorLayout({
  children,
  params,
}: JourneyEditorLayoutProps) {
  const { eventId, journeyId } = await params

  // Fetch event and journey in parallel
  const [eventResult, journeyResult] = await Promise.all([
    getEventAction(eventId),
    getJourneyAction(eventId, journeyId),
  ]);

  if (!eventResult.success || !eventResult.event) {
    notFound()
  }

  const event = eventResult.event
  const journeyName = journeyResult.success
    ? journeyResult.data.name
    : `Journey ${journeyId}`

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <EditorHeader
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${eventId}/design` },
          { label: journeyName },
        ]}
        exitUrl={`/events/${eventId}/design/journeys`}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
