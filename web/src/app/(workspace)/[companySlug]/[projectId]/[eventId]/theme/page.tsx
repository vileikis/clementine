import { getEventAction } from "@/features/events/actions";
import { EventThemeEditor } from "@/features/events/components/designer/EventThemeEditor";
import { notFound } from "next/navigation";

interface ThemePageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event theme page
 * Header/breadcrumbs handled by event layout
 */
export default async function ThemePage({ params }: ThemePageProps) {
  const { projectId, eventId } = await params;

  // Fetch event
  const eventResult = await getEventAction(projectId, eventId);
  if (!eventResult.success || !eventResult.data?.event) {
    notFound();
  }

  const event = eventResult.data.event;

  return (
    <div className="p-6">
      <EventThemeEditor event={event} projectId={projectId} />
    </div>
  );
}
