/**
 * usePreshare Hook
 *
 * Determines if a guest needs to complete a preshare experience after the main experience.
 * Used for routing logic when guest completes their main experience.
 *
 * Preshare Logic:
 * 1. Check if preshare is configured and enabled in publishedConfig
 * 2. Check if guest has already completed that specific preshare experience
 * 3. If both conditions met → guest needs preshare
 */
import { useMemo } from 'react'
import type { Guest } from '../schemas/guest.schema'
import type { ExperiencesConfig } from '@clementine/shared'

export interface UsePreshareResult {
  /**
   * Check if guest needs to complete preshare before accessing share screen.
   * Returns true if preshare is enabled AND guest hasn't completed it.
   */
  needsPreshare: () => boolean
  /**
   * The preshare experience ID, or null if not configured
   */
  preshareExperienceId: string | null
}

/**
 * Hook for preshare routing logic
 *
 * Determines whether a guest needs to complete preshare after the main experience.
 * Uses the guest's completedExperiences array to check for prior completion.
 *
 * @param guest - Guest record from context
 * @param config - ExperiencesConfig from publishedConfig
 * @returns Preshare check function and experience ID
 *
 * @example
 * ```tsx
 * function ExperiencePage() {
 *   const { guest, event, project } = useGuestContext()
 *   const { needsPreshare, preshareExperienceId } = usePreshare(
 *     guest,
 *     event.publishedConfig?.experiences ?? null
 *   )
 *
 *   const handleComplete = (sessionId: string) => {
 *     // Mark main experience complete...
 *
 *     if (needsPreshare()) {
 *       // Navigate to preshare with main session ID
 *       navigate({
 *         to: '/join/$projectId/preshare',
 *         search: { session: sessionId },
 *         replace: true,
 *       })
 *     } else {
 *       // Navigate directly to share
 *       navigate({
 *         to: '/join/$projectId/share',
 *         search: { session: sessionId },
 *         replace: true,
 *       })
 *     }
 *   }
 * }
 * ```
 */
export function usePreshare(
  guest: Guest,
  config: ExperiencesConfig | null,
): UsePreshareResult {
  const preshareExperienceId = config?.preshare?.experienceId ?? null

  const needsPreshare = useMemo(() => {
    return (): boolean => {
      const preshare = config?.preshare
      if (!preshare?.enabled) return false
      if (!preshare.experienceId) return false

      // Check if guest has already completed this specific preshare
      const hasCompleted = guest.completedExperiences.some(
        (e) => e.experienceId === preshare.experienceId,
      )

      return !hasCompleted
    }
  }, [guest.completedExperiences, config?.preshare])

  return {
    needsPreshare,
    preshareExperienceId,
  }
}
