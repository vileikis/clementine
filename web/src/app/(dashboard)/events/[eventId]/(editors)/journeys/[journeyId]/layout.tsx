import { getEventAction } from "@/features/events"
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
  const result = await getEventAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <EditorHeader
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${eventId}/design` },
          { label: `Journey ${journeyId}` },
        ]}
        exitUrl={`/events/${eventId}/design/journeys`}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
