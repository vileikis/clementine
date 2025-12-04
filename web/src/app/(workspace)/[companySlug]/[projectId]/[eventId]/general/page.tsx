import { getEventAction } from "@/features/events/actions";
import { EventGeneralTab } from "@/features/events/components";
import { notFound } from "next/navigation";

interface GeneralPageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event general page - experiences and extras configuration
 * Header/breadcrumbs handled by event layout
 */
export default async function GeneralPage({ params }: GeneralPageProps) {
  const { projectId, eventId } = await params;

  // Fetch event
  const eventResult = await getEventAction(projectId, eventId);
  if (!eventResult.success || !eventResult.data?.event) {
    notFound();
  }

  const event = eventResult.data.event;

  return (
    <div className="p-6">
      <EventGeneralTab event={event} />
    </div>
  );
}
