import { getEventAction } from "@/features/events/actions";
import { EventOutroEditor } from "@/features/events/components/outro";
import { notFound } from "next/navigation";

interface OutroPageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event outro page - end-of-experience message and share options configuration
 * Header/breadcrumbs handled by event layout
 */
export default async function OutroPage({ params }: OutroPageProps) {
  const { projectId, eventId } = await params;

  // Fetch event
  const eventResult = await getEventAction(projectId, eventId);
  if (!eventResult.success || !eventResult.data?.event) {
    notFound();
  }

  const event = eventResult.data.event;

  return (
    <div className="p-6">
      <EventOutroEditor event={event} projectId={projectId} />
    </div>
  );
}
