/**
 * usePregate Hook
 *
 * Determines if a guest needs to complete a pregate experience before the main experience.
 * Used for routing logic when guest selects an experience from the welcome screen.
 *
 * Pregate Logic:
 * 1. Check if pregate is configured and enabled in publishedConfig
 * 2. Check if guest has already completed that specific pregate experience
 * 3. If both conditions met → guest needs pregate
 */
import { useMemo } from 'react'
import type { Guest } from '../schemas/guest.schema'
import type { ExperiencesConfig } from '@clementine/shared'

export interface UsePregateResult {
  /**
   * Check if guest needs to complete pregate before accessing main experience.
   * Returns true if pregate is enabled AND guest hasn't completed it.
   */
  needsPregate: () => boolean
  /**
   * The pregate experience ID, or null if not configured
   */
  pregateExperienceId: string | null
}

/**
 * Hook for pregate routing logic
 *
 * Determines whether a guest needs to complete pregate before the main experience.
 * Uses the guest's completedExperiences array to check for prior completion.
 *
 * @param guest - Guest record from context
 * @param config - ExperiencesConfig from publishedConfig
 * @returns Pregate check function and experience ID
 *
 * @example
 * ```tsx
 * function WelcomeScreen() {
 *   const { guest, event } = useGuestContext()
 *   const { needsPregate, pregateExperienceId } = usePregate(
 *     guest,
 *     event.publishedConfig?.experiences ?? null
 *   )
 *
 *   const handleSelectExperience = (experienceId: string) => {
 *     if (needsPregate()) {
 *       // Navigate to pregate with experience ID preserved
 *       navigate({
 *         to: '/join/$projectId/pregate',
 *         search: { experience: experienceId },
 *       })
 *     } else {
 *       // Navigate directly to experience
 *       navigate({
 *         to: '/join/$projectId/experience/$experienceId',
 *         params: { experienceId },
 *       })
 *     }
 *   }
 * }
 * ```
 */
export function usePregate(
  guest: Guest,
  config: ExperiencesConfig | null,
): UsePregateResult {
  const pregateExperienceId = config?.pregate?.experienceId ?? null

  const needsPregate = useMemo(() => {
    return (): boolean => {
      const pregate = config?.pregate
      if (!pregate?.enabled) return false
      if (!pregate.experienceId) return false

      // Check if guest has already completed this specific pregate
      const hasCompleted = guest.completedExperiences.some(
        (e) => e.experienceId === pregate.experienceId,
      )

      return !hasCompleted
    }
  }, [guest.completedExperiences, config?.pregate])

  return {
    needsPregate,
    pregateExperienceId,
  }
}
