/**
 * useUpdateExperience Hook
 *
 * Mutation hook for updating an existing experience.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { updateExperienceInputSchema } from '../schemas/experience.input.schemas'
import { experienceKeys } from '../queries/experience.query'
import type { UpdateExperienceInput } from '../schemas/experience.input.schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Result returned on successful experience update
 */
export interface UpdateExperienceResult {
  /** Updated experience document ID */
  experienceId: string
  /** Workspace ID for cache invalidation */
  workspaceId: string
}

/**
 * Hook for updating an existing experience
 *
 * Features:
 * - Validates input with Zod schema
 * - Updates document in transaction with serverTimestamp()
 * - Only updates provided fields (partial update)
 * - Invalidates both list and detail caches on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function RenameDialog({ experience }) {
 *   const updateExperience = useUpdateExperience()
 *
 *   const handleRename = async (newName) => {
 *     try {
 *       await updateExperience.mutateAsync({
 *         workspaceId: experience.workspaceId,
 *         experienceId: experience.id,
 *         name: newName,
 *       })
 *       toast.success('Experience renamed')
 *     } catch {
 *       toast.error('Failed to rename experience')
 *     }
 *   }
 * }
 * ```
 */
export function useUpdateExperience() {
  const queryClient = useQueryClient()

  return useMutation<UpdateExperienceResult, Error, UpdateExperienceInput>({
    mutationFn: async (input) => {
      // Validate input
      const validated = updateExperienceInputSchema.parse(input)

      const experienceRef = doc(
        firestore,
        `workspaces/${validated.workspaceId}/experiences/${validated.experienceId}`,
      )

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (validated.name !== undefined) {
        updateData.name = validated.name
      }

      if (validated.media !== undefined) {
        updateData.media = validated.media
      }

      // Update in transaction
      await runTransaction(firestore, (transaction) => {
        transaction.update(experienceRef, updateData)
        return Promise.resolve()
      })

      return {
        experienceId: validated.experienceId,
        workspaceId: validated.workspaceId,
      }
    },
    onSuccess: ({ workspaceId, experienceId }) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: experienceKeys.lists(),
        predicate: (query) => {
          const key = query.queryKey as string[]
          return key[2] === workspaceId
        },
      })

      // Invalidate detail query
      queryClient.invalidateQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/library',
          action: 'update-experience',
        },
      })
    },
  })
}
