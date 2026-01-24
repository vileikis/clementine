/**
 * Experience Page Route
 *
 * Child route for individual experience pages.
 * GuestContext is available via parent layout (GuestLayout).
 * Session management is handled by ExperiencePage via useInitSession.
 *
 * URL: /join/:projectId/experience/:experienceId?session=<sessionId>&pregate=<pregateSessionId>
 *
 * Search params:
 * - session: Existing session ID for resumption
 * - pregate: Pregate session ID for linking (passed when coming from pregate)
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ExperiencePage } from '@/domains/guest'

// Search params schema for session ID and pregate session linking
const searchSchema = z.object({
  /** Existing session ID for resumption */
  session: z.string().optional(),
  /** Pregate session ID for linking (passed when coming from pregate) */
  pregate: z.string().optional(),
})

export const Route = createFileRoute(
  '/join/$projectId/experience/$experienceId',
)({
  validateSearch: searchSchema,
  component: JoinExperiencePage,
})

function JoinExperiencePage() {
  const { experienceId } = Route.useParams()
  const { session, pregate } = Route.useSearch()

  return (
    <ExperiencePage
      experienceId={experienceId}
      sessionId={session}
      pregateSessionId={pregate}
    />
  )
}
