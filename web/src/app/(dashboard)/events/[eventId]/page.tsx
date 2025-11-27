import { redirect } from "next/navigation"

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>
}

/**
 * Default page for event detail - redirects to Design tab
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 * Updated in Phase 6 (User Story 4) - Rename Content to Design
 */
export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { eventId } = await params
  redirect(`/events/${eventId}/journeys`)
}
