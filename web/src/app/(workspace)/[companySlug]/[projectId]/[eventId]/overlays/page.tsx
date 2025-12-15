import { getEventAction } from "@/features/events/actions";
import { OverlaySection } from "@/features/events/components/overlay";
import { notFound } from "next/navigation";

interface OverlaysPageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event overlays page - frame overlay configuration
 * Header/breadcrumbs handled by event layout
 */
export default async function OverlaysPage({ params }: OverlaysPageProps) {
  const { projectId, eventId } = await params;

  // Fetch event
  const eventResult = await getEventAction(projectId, eventId);
  if (!eventResult.success || !eventResult.data?.event) {
    notFound();
  }

  const event = eventResult.data.event;

  return (
    <div className="p-6">
      <OverlaySection event={event} projectId={projectId} />
    </div>
  );
}
