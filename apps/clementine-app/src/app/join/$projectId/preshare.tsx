/**
 * Preshare Route
 *
 * Route for preshare experience that runs after the main experience.
 * Captures surveys, feedback, promotional content, etc.
 *
 * URL: /join/:projectId/preshare?session=<mainSessionId>
 *
 * Navigation:
 * - From main experience: replace navigation (back returns to welcome)
 * - To share screen: replace navigation (back returns to welcome)
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PresharePage } from '@/domains/guest'

const searchSchema = z.object({
  /** Main session ID for linking and result display */
  session: z.string().min(1, 'Session ID required'),
})

export const Route = createFileRoute('/join/$projectId/preshare')({
  validateSearch: searchSchema,
  component: JoinPresharePage,
})

function JoinPresharePage() {
  const { session } = Route.useSearch()

  return <PresharePage mainSessionId={session} />
}
