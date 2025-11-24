import { redirect } from "next/navigation";

interface DesignPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Design page redirects to Journeys by default
 */
export default async function DesignPage({ params }: DesignPageProps) {
  const { eventId } = await params;
  redirect(`/events/${eventId}/design/journeys`);
}
