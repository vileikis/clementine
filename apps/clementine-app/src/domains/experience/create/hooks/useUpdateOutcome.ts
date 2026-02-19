/**
 * useUpdateOutcome Hook
 *
 * Mutation hook for updating the outcome configuration in experience draft.
 * Updates draft.outcome field with cache invalidation.
 * Uses tracked mutation for save status tracking.
 *
 * Writes per-type config structure: outcome.type + active type's config.
 * Non-active type configs are NOT cleared (preserves switching).
 *
 * @see specs/072-outcome-schema-redesign
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'

import { experienceKeys } from '../../shared/queries/experience.query'
import { updateExperienceConfigField } from '../../shared/lib'
import { useExperienceDesignerStore } from '../../designer/stores'
import type { Outcome } from '@clementine/shared'
import { useTrackedMutation } from '@/shared/editor-status/hooks/useTrackedMutation'

/**
 * Input for updating outcome
 */
export interface UpdateOutcomeInput {
  /** Updated outcome configuration */
  outcome: Outcome
}

/**
 * Hook for updating experience outcome configuration
 *
 * Features:
 * - Updates draft.outcome field with serverTimestamp() for updatedAt
 * - Atomically increments draftVersion for optimistic locking
 * - Invalidates experience detail cache on success
 * - Captures errors to Sentry with domain tags
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns TanStack Mutation result
 */
export function useUpdateOutcome(workspaceId: string, experienceId: string) {
  const queryClient = useQueryClient()
  const store = useExperienceDesignerStore()

  const mutation = useMutation<void, Error, UpdateOutcomeInput>({
    mutationFn: async ({ outcome }) => {
      await updateExperienceConfigField(workspaceId, experienceId, {
        outcome,
      })
    },
    onSuccess: () => {
      // Invalidate detail query to refresh cache
      queryClient.invalidateQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/create',
          action: 'update-outcome',
        },
      })
    },
  })

  // Wrap with tracked mutation for save status tracking
  return useTrackedMutation(mutation, store)
}
