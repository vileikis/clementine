/**
 * useUpdateTransformConfig Hook
 *
 * Mutation hook for updating the transform configuration in experience draft.
 * Updates draft.transform field with transaction, draftVersion increment, and cache invalidation.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { experienceKeys } from '../../shared/queries/experience.query'
import type { TransformConfig } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input for updating transform configuration
 */
export interface UpdateTransformConfigInput {
  /** Workspace containing the experience */
  workspaceId: string
  /** Experience document ID */
  experienceId: string
  /** Updated transform configuration */
  transform: TransformConfig
}

/**
 * Result returned on successful transform update
 */
export interface UpdateTransformConfigResult {
  /** Updated experience document ID */
  experienceId: string
  /** Workspace ID for cache invalidation */
  workspaceId: string
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
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function TransformPipelineEditor({ experience }) {
 *   const updateTransformConfig = useUpdateTransformConfig()
 *
 *   const handleAddNode = async (newNode) => {
 *     const updatedTransform = {
 *       ...experience.draft.transform,
 *       nodes: [...experience.draft.transform.nodes, newNode],
 *     }
 *
 *     await updateTransformConfig.mutateAsync({
 *       workspaceId: experience.workspaceId,
 *       experienceId: experience.id,
 *       transform: updatedTransform,
 *     })
 *   }
 * }
 * ```
 */
export function useUpdateTransformConfig() {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateTransformConfigResult,
    Error,
    UpdateTransformConfigInput
  >({
    mutationFn: async (input) => {
      const { workspaceId, experienceId, transform } = input

      const experienceRef = doc(
        firestore,
        `workspaces/${workspaceId}/experiences/${experienceId}`,
      )

      // Update draft.transform with atomic version increment in transaction
      await runTransaction(firestore, (transaction) => {
        transaction.update(experienceRef, {
          'draft.transform': transform,
          draftVersion: increment(1),
          updatedAt: serverTimestamp(),
        })
        return Promise.resolve()
      })

      return {
        experienceId,
        workspaceId,
      }
    },
    onSuccess: ({ workspaceId, experienceId }) => {
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
}
