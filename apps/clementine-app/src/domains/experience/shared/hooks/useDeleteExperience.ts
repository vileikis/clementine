/**
 * useDeleteExperience Hook
 *
 * Mutation hook for soft-deleting workspace experiences.
 * Uses transaction to ensure serverTimestamp() resolves before returning.
 *
 * Soft Delete:
 * - Sets status to 'deleted'
 * - Sets deletedAt timestamp
 * - Experience no longer appears in list queries
 * - Idempotent: deleting already-deleted experience is a no-op
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import type { DeleteExperienceInput } from '../types/workspace-experience.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input validation schema for deleting an experience
 */
const deleteExperienceInputSchema = z.object({
  workspaceId: z.string().min(1),
  experienceId: z.string().min(1),
})

/**
 * Delete (soft-delete) workspace experience mutation (admin-only operation)
 *
 * Performs soft delete:
 * - Sets status to 'deleted'
 * - Sets deletedAt timestamp
 * - Experience will no longer appear in list queries
 *
 * Idempotent: If experience is already deleted, no error is thrown.
 *
 * @example
 * ```tsx
 * const deleteExperience = useDeleteExperience()
 *
 * const handleDelete = async () => {
 *   if (confirm('Delete this experience?')) {
 *     await deleteExperience.mutateAsync({
 *       workspaceId: 'ws-123',
 *       experienceId: 'exp-456',
 *     })
 *   }
 * }
 * ```
 */
export function useDeleteExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteExperienceInput): Promise<void> => {
      // Validate input
      const validated = deleteExperienceInputSchema.parse(input)

      const experienceRef = doc(
        firestore,
        `workspaces/${validated.workspaceId}/experiences`,
        validated.experienceId,
      )

      // Use transaction for atomic read-then-write
      await runTransaction(firestore, async (transaction) => {
        // Read current state using transaction.get for consistency
        const experienceSnapshot = await transaction.get(experienceRef)

        // Idempotent: non-existent or already deleted is a no-op
        if (
          !experienceSnapshot.exists() ||
          experienceSnapshot.data().status === 'deleted'
        ) {
          return
        }

        // Perform soft delete
        transaction.update(experienceRef, {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate list query (experience will be filtered out)
      queryClient.invalidateQueries({
        queryKey: ['workspaceExperiences', variables.workspaceId],
      })

      // Also invalidate single experience query
      queryClient.invalidateQueries({
        queryKey: [
          'workspaceExperience',
          variables.workspaceId,
          variables.experienceId,
        ],
      })
    },
    onError: (error, variables) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience',
          action: 'delete-experience',
        },
        extra: {
          workspaceId: variables.workspaceId,
          experienceId: variables.experienceId,
        },
      })
    },
  })
}
