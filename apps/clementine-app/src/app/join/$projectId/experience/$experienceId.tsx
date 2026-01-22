/**
 * Experience Page Route
 *
 * Child route for individual experience pages.
 * GuestContext is available via parent layout (GuestLayout).
 * Session management is handled by ExperiencePage via useInitSession.
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ExperiencePage } from '@/domains/guest'

// Search params schema for session ID
const searchSchema = z.object({
  session: z.string().optional(),
})

export const Route = createFileRoute(
  '/join/$projectId/experience/$experienceId',
)({
  validateSearch: searchSchema,
  component: JoinExperiencePage,
})

function JoinExperiencePage() {
  const { experienceId } = Route.useParams()
  const { session } = Route.useSearch()

  return <ExperiencePage experienceId={experienceId} sessionId={session} />
}
