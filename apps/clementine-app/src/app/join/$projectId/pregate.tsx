/**
 * Pregate Route
 *
 * Route for pregate experience that runs before the main experience.
 * Captures consent, contact info, surveys, etc.
 *
 * URL: /join/:projectId/pregate?experience=<selectedExperienceId>
 *
 * Navigation:
 * - From welcome screen: push navigation (back returns to welcome)
 * - To main experience: replace navigation (back returns to welcome, not pregate)
 */
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PregatePage } from '@/domains/guest'

const searchSchema = z.object({
  /** Selected main experience ID to navigate to after pregate completion */
  experience: z.string().min(1, 'Experience ID required'),
})

export const Route = createFileRoute('/join/$projectId/pregate')({
  validateSearch: searchSchema,
  component: JoinPregatePage,
})

function JoinPregatePage() {
  const { experience } = Route.useSearch()

  return <PregatePage selectedExperienceId={experience} />
}
