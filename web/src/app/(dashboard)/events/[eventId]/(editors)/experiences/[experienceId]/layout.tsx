import { getEventAction } from "@/features/events"
import { notFound } from "next/navigation"
import { EditorHeader } from "@/components/shared"

interface ExperienceEditorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string; experienceId: string }>;
}

/**
 * Experience Editor Layout
 * Fullscreen editor with minimal header and breadcrumbs
 */
export default async function ExperienceEditorLayout({
  children,
  params,
}: ExperienceEditorLayoutProps) {
  const { eventId, experienceId } = await params
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
          { label: event.title, href: `/events/${eventId}/design` },
          { label: `Experience ${experienceId}` },
        ]}
        exitUrl={`/events/${eventId}/design/experiences`}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
