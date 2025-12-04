import { redirect } from "next/navigation";

interface EventPageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event root page - redirects to experiences
 */
export default async function EventPage({ params }: EventPageProps) {
  const { companySlug, projectId, eventId } = await params;
  redirect(`/${companySlug}/${projectId}/${eventId}/general`);
}
