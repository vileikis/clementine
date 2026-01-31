/**
 * useUpdateTransformConfig Hook
 *
 * Mutation hook for updating the transform configuration in experience draft.
 * Updates draft.transform field with transaction, draftVersion increment, and cache invalidation.
 * Uses tracked mutation for save status tracking.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'

import { experienceKeys } from '../../shared/queries/experience.query'
import { updateExperienceConfigField } from '../../shared/lib'
import { useGenerateEditorStore } from '../stores/useGenerateEditorStore'
import type { TransformConfig } from '@clementine/shared'
import { useTrackedMutation } from '@/shared/editor-status/hooks/useTrackedMutation'

/**
 * Input for updating transform configuration
 */
export interface UpdateTransformConfigInput {
  /** Updated transform configuration */
  transform: TransformConfig
}

/**
 * Hook for updating experience transform configuration
 *
 * Features:
 * - Updates draft.transform field with serverTimestamp() for updatedAt
 * - Atomically increments draftVersion for optimistic locking
 * - Invalidates experience detail cache on success
 * - Captures errors to Sentry with domain tags
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function TransformPipelineEditor({ experience, workspaceId }) {
 *   const updateTransform = useUpdateTransformConfig(workspaceId, experience.id)
 *
 *   const handleAddNode = () => {
 *     const newTransform = addNode(experience.draft.transform)
 *     updateTransform.mutate({ transform: newTransform })
 *   }
 * }
 * ```
 */
export function useUpdateTransformConfig(
  workspaceId: string,
  experienceId: string,
) {
  const queryClient = useQueryClient()
  const store = useGenerateEditorStore()

  const mutation = useMutation<void, Error, UpdateTransformConfigInput>({
    mutationFn: async ({ transform }) => {
      await updateExperienceConfigField(workspaceId, experienceId, {
        transform,
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
          domain: 'experience/generate',
          action: 'update-transform-config',
        },
      })
    },
  })

  // Wrap with tracked mutation for save status tracking
  return useTrackedMutation(mutation, store)
}
