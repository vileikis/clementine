/**
 * useDeleteExperience Hook
 *
 * Mutation hook for soft-deleting an experience.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { deleteExperienceInputSchema } from '../schemas/experience.input.schemas'
import { experienceKeys } from '../queries/experience.query'
import type { DeleteExperienceInput } from '../schemas/experience.input.schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Result returned on successful experience deletion
 */
export interface DeleteExperienceResult {
  /** Deleted experience document ID */
  experienceId: string
  /** Workspace ID for cache invalidation */
  workspaceId: string
}

/**
 * Hook for soft-deleting an experience
 *
 * Features:
 * - Validates input with Zod schema
 * - Sets status: 'deleted' and deletedAt timestamp (soft delete)
 * - Does NOT delete document (preserves data for audit)
 * - Invalidates experience caches on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function DeleteDialog({ experience, workspaceId }) {
 *   const deleteExperience = useDeleteExperience()
 *
 *   const handleDelete = async () => {
 *     try {
 *       await deleteExperience.mutateAsync({
 *         workspaceId,
 *         experienceId: experience.id,
 *       })
 *       toast.success('Experience deleted')
 *     } catch {
 *       toast.error('Failed to delete experience')
 *     }
 *   }
 * }
 * ```
 */
export function useDeleteExperience() {
  const queryClient = useQueryClient()

  return useMutation<DeleteExperienceResult, Error, DeleteExperienceInput>({
    mutationFn: async (input) => {
      // Validate input
      const validated = deleteExperienceInputSchema.parse(input)

      const experienceRef = doc(
        firestore,
        `workspaces/${validated.workspaceId}/experiences/${validated.experienceId}`,
      )

      // Soft delete: update status and set deletedAt timestamp
      await runTransaction(firestore, (transaction) => {
        transaction.update(experienceRef, {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        return Promise.resolve()
      })

      return {
        experienceId: validated.experienceId,
        workspaceId: validated.workspaceId,
      }
    },
    onSuccess: ({ workspaceId, experienceId }) => {
      // Invalidate list queries (experience will be filtered out)
      queryClient.invalidateQueries({
        queryKey: experienceKeys.lists(),
        predicate: (query) => {
          const key = query.queryKey as string[]
          return key[2] === workspaceId
        },
      })

      // Remove detail from cache
      queryClient.removeQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/library',
          action: 'delete-experience',
        },
      })
    },
  })
}
