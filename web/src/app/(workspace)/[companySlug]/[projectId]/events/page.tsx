import { ProjectEventsTab } from "@/features/projects/components";

interface EventsPageProps {
  params: Promise<{ companySlug: string; projectId: string }>;
}

/**
 * Project events page
 * Displays the list of events for a project.
 * Layout handled by parent layout.tsx
 */
export default async function EventsPage({ params }: EventsPageProps) {
  const { projectId } = await params;
  return <ProjectEventsTab projectId={projectId} />;
}
