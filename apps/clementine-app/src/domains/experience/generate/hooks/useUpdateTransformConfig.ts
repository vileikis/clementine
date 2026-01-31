/**
 * useUpdateTransformNodes Hook
 *
 * Mutation hook for updating the transform nodes in experience draft.
 * Updates draft.transformNodes field with transaction, draftVersion increment, and cache invalidation.
 * Uses tracked mutation for save status tracking.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'

import { experienceKeys } from '../../shared/queries/experience.query'
import { updateExperienceConfigField } from '../../shared/lib'
import { useExperienceDesignerStore } from '../../designer/stores'
import type { TransformNode } from '@clementine/shared'
import { useTrackedMutation } from '@/shared/editor-status/hooks/useTrackedMutation'

/**
 * Input for updating transform nodes
 */
export interface UpdateTransformNodesInput {
  /** Updated transform nodes array */
  transformNodes: TransformNode[]
}

/**
 * Hook for updating experience transform nodes
 *
 * Features:
 * - Updates draft.transformNodes field with serverTimestamp() for updatedAt
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
 *   const updateTransformNodes = useUpdateTransformNodes(workspaceId, experience.id)
 *
 *   const handleAddNode = () => {
 *     const newNodes = addNode(experience.draft.transformNodes)
 *     updateTransformNodes.mutate({ transformNodes: newNodes })
 *   }
 * }
 * ```
 */
export function useUpdateTransformNodes(
  workspaceId: string,
  experienceId: string,
) {
  const queryClient = useQueryClient()
  const store = useExperienceDesignerStore()

  const mutation = useMutation<void, Error, UpdateTransformNodesInput>({
    mutationFn: async ({ transformNodes }) => {
      await updateExperienceConfigField(workspaceId, experienceId, {
        transformNodes,
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
          action: 'update-transform-nodes',
        },
      })
    },
  })

  // Wrap with tracked mutation for save status tracking
  return useTrackedMutation(mutation, store)
}

/**
 * @deprecated Use useUpdateTransformNodes instead
 */
export const useUpdateTransformConfig = useUpdateTransformNodes
