import { notFound } from "next/navigation";
import { getProjectAction } from "@/features/projects/actions";
import { getEventAction } from "@/features/events/actions";
import { EventDetailsHeader } from "@/features/events/components";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Layout for event pages with header (breadcrumbs + tabs).
 * Replaces project-level navigation when viewing an event.
 */
export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { companySlug, projectId, eventId } = await params;

  // Fetch project for name
  const projectResult = await getProjectAction(projectId);
  if (!projectResult.success || !projectResult.project) {
    notFound();
  }

  // Fetch event for name
  const eventResult = await getEventAction(projectId, eventId);
  if (!eventResult.success || !eventResult.data?.event) {
    notFound();
  }

  const project = projectResult.project;
  const event = eventResult.data.event;

  return (
    <div className="flex flex-col h-full">
      <EventDetailsHeader
        companySlug={companySlug}
        projectId={projectId}
        event={event}
        projectName={project.name}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
