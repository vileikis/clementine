/**
 * useUpdateExperienceConfig Hook
 *
 * Mutation hook for updating per-type configuration in experience draft.
 * Writes individual config fields (e.g., draft.aiImage, draft.photo) with cache invalidation.
 * Uses tracked mutation for save status tracking.
 *
 * @see specs/081-experience-type-flattening
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'

import { experienceKeys } from '../../shared/queries/experience.query'
import { updateExperienceConfigField } from '../../shared/lib'
import { useExperienceDesignerStore } from '../../designer/stores'
import { useTrackedMutation } from '@/shared/editor-status/hooks/useTrackedMutation'

/**
 * Input for updating experience config
 */
export interface UpdateExperienceConfigInput {
  /** Config field updates (e.g., { aiImage: config } or { photo: config }) */
  updates: Record<string, unknown>
}

/**
 * Hook for updating experience per-type configuration
 *
 * Features:
 * - Updates draft config fields with serverTimestamp() for updatedAt
 * - Atomically increments draftVersion for optimistic locking
 * - Invalidates experience detail cache on success
 * - Captures errors to Sentry with domain tags
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns TanStack Mutation result
 */
export function useUpdateExperienceConfig(
  workspaceId: string,
  experienceId: string,
) {
  const queryClient = useQueryClient()
  const store = useExperienceDesignerStore()

  const mutation = useMutation<void, Error, UpdateExperienceConfigInput>({
    mutationFn: async ({ updates }) => {
      await updateExperienceConfigField(workspaceId, experienceId, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/create',
          action: 'update-experience-config',
        },
      })
    },
  })

  return useTrackedMutation(mutation, store)
}
