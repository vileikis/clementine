/**
 * Share Route
 *
 * Route for the share screen after main experience (and optional preshare) completion.
 * Displays transform processing state and final result.
 *
 * URL: /join/:projectId/share?session=<mainSessionId>
 *
 * Navigation:
 * - From main experience (no preshare): replace navigation
 * - From preshare: replace navigation
 * - Browser back: returns to welcome screen (due to replace)
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SharePage } from '@/domains/guest'

const searchSchema = z.object({
  /** Main session ID for result display */
  session: z.string().min(1, 'Session ID required'),
})

export const Route = createFileRoute('/join/$projectId/share')({
  validateSearch: searchSchema,
  component: JoinSharePage,
})

function JoinSharePage() {
  const { session } = Route.useSearch()

  return <SharePage mainSessionId={session} />
}
