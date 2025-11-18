import { redirect } from "next/navigation";

/**
 * Base design route - redirects to welcome editor
 * FR-015: Default design route behavior
 */
export default async function DesignPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/events/${eventId}/design/welcome`);
}
