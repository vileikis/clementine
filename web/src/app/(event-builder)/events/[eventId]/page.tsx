import { redirect } from "next/navigation"

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>
}

/**
 * Default page for event detail - redirects to Content tab
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 */
export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { eventId } = await params
  redirect(`/events/${eventId}/content`)
}
