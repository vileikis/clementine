/**
 * useUpdateProjectExperiences Hook
 *
 * Mutation hook for updating project experiences configuration.
 * Uses Firestore transactions for atomic updates to prevent race conditions.
 *
 * Pattern: TanStack Query mutation with Firestore transaction
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'

import type { Project } from '@clementine/shared'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input for updating experiences configuration
 * Partial updates allowed - only provide fields you want to change
 */
export interface UpdateExperiencesInput {
  /** Update main experiences array */
  main?: MainExperienceReference[]
  /** Update pregate experience */
  pregate?: ExperienceReference | null
  /** Update preshare experience */
  preshare?: ExperienceReference | null
}

/**
 * Parameters for the hook
 * Accepts undefined - mutation will throw if called without valid ID
 */
export interface UseUpdateProjectExperiencesParams {
  projectId: string | undefined
}

/**
 * Hook to update project experiences configuration with transactions
 *
 * Features:
 * - Atomic updates using Firestore transactions
 * - Prevents race conditions during rapid updates
 * - Automatic query invalidation (triggers re-render)
 * - Error handling with Sentry
 * - Supports partial updates (main, pregate, or preshare independently)
 *
 * Implementation:
 * - Uses runTransaction for atomic read-modify-write
 * - Merges input with existing experiences config
 * - Increments draftVersion for change tracking
 * - Invalidates project query on success
 *
 * @param params - Project identifier
 * @returns TanStack Query mutation result
 *
 * @example
 * ```tsx
 * const updateExperiences = useUpdateProjectExperiences({ projectId })
 *
 * // Add experience to main slot
 * await updateExperiences.mutateAsync({
 *   main: [
 *     ...currentMain,
 *     { experienceId: 'exp_123', enabled: true, applyOverlay: true }
 *   ]
 * })
 *
 * // Update pregate slot
 * await updateExperiences.mutateAsync({
 *   pregate: { experienceId: 'exp_456', enabled: true }
 * })
 *
 * // Remove preshare experience
 * await updateExperiences.mutateAsync({
 *   preshare: null
 * })
 * ```
 */
export function useUpdateProjectExperiences({
  projectId,
}: UseUpdateProjectExperiencesParams) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateExperiencesInput) => {
      // Guard against missing params
      if (!projectId) {
        throw new Error('Cannot update experiences: missing projectId')
      }

      await runTransaction(firestore, async (transaction) => {
        const projectRef = doc(firestore, 'projects', projectId)

        // Read current state
        const projectDoc = await transaction.get(projectRef)
        if (!projectDoc.exists()) {
          throw new Error('Project not found')
        }

        const currentConfig = projectDoc.data().draftConfig ?? {}
        const currentExperiences = currentConfig.experiences ?? {
          main: [],
          pregate: null,
          preshare: null,
        }

        // Merge input with current state
        const updatedExperiences = {
          ...currentExperiences,
          ...input,
        }

        // Atomic update with version increment
        const updateData: UpdateData<Project> = {
          'draftConfig.experiences': updatedExperiences,
          draftVersion: increment(1),
          updatedAt: serverTimestamp(),
        }

        transaction.update(projectRef, updateData)

        return Promise.resolve()
      })
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      // Safe to use ! here - mutationFn throws if projectId is undefined
      queryClient.invalidateQueries({
        queryKey: ['project', projectId!],
      })
    },

    // Error: report to Sentry
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project-config/experiences',
          action: 'update-project-experiences',
        },
        extra: {
          errorType: 'project-experiences-update-failure',
          projectId: projectId ?? 'undefined',
        },
      })
    },
  })
}
