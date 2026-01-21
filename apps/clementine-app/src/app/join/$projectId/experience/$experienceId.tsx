import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ExperiencePlaceholder } from '@/domains/guest'

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
  const { projectId, experienceId } = Route.useParams()
  const { session } = Route.useSearch()

  return (
    <ExperiencePlaceholder
      projectId={projectId}
      experienceId={experienceId}
      sessionId={session}
    />
  )
}
