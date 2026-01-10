/**
 * useUpdateExperience Hook
 *
 * Mutation hook for updating workspace experiences.
 * Uses transaction to ensure serverTimestamp() resolves before returning.
 *
 * Key Constraints:
 * - Profile is IMMUTABLE after creation (rejected)
 * - Cannot update deleted experiences (rejected)
 * - updatedAt is automatically set
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import type { UpdateExperienceInput } from '../types/workspace-experience.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input validation schema for updating an experience
 */
const updateExperienceInputSchema = z.object({
  workspaceId: z.string().min(1),
  experienceId: z.string().min(1),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    media: z
      .object({
        mediaAssetId: z.string(),
        url: z.string().url(),
      })
      .nullable()
      .optional(),
    steps: z.array(z.unknown()).optional(),
    // Note: profile is intentionally NOT in the schema (immutable)
  }),
})

/**
 * Error thrown when attempting to update profile (immutable field)
 */
export class ProfileImmutableError extends Error {
  constructor() {
    super('Experience profile cannot be changed after creation')
    this.name = 'ProfileImmutableError'
  }
}

/**
 * Error thrown when attempting to update a deleted experience
 */
export class UpdateDeletedExperienceError extends Error {
  constructor(experienceId: string) {
    super(`Cannot update deleted experience: ${experienceId}`)
    this.name = 'UpdateDeletedExperienceError'
  }
}

/**
 * Update workspace experience mutation (admin-only operation)
 *
 * Updates experience name, media, and/or steps.
 * Profile is immutable and cannot be changed.
 * Cannot update deleted experiences.
 *
 * @example
 * ```tsx
 * const updateExperience = useUpdateExperience()
 *
 * const handleRename = async (newName: string) => {
 *   await updateExperience.mutateAsync({
 *     workspaceId: 'ws-123',
 *     experienceId: 'exp-456',
 *     updates: { name: newName },
 *   })
 * }
 * ```
 */
export function useUpdateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateExperienceInput): Promise<void> => {
      // Validate input
      const validated = updateExperienceInputSchema.parse(input)

      // Check if profile update was attempted (would fail schema validation,
      // but we add explicit check for clarity)
      if ('profile' in (input.updates as Record<string, unknown>)) {
        throw new ProfileImmutableError()
      }

      const experienceRef = doc(
        firestore,
        `workspaces/${validated.workspaceId}/experiences`,
        validated.experienceId,
      )

      // Use transaction to ensure atomic read-then-write
      await runTransaction(firestore, async (transaction) => {
        // Read current state
        const experienceSnapshot = await getDoc(experienceRef)

        if (!experienceSnapshot.exists()) {
          throw new Error(
            `Experience not found: ${validated.experienceId}`,
          )
        }

        const currentData = experienceSnapshot.data()

        // Reject updates on deleted experiences
        if (currentData.status === 'deleted') {
          throw new UpdateDeletedExperienceError(validated.experienceId)
        }

        // Build update object
        const updateData: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        }

        if (validated.updates.name !== undefined) {
          updateData.name = validated.updates.name
        }

        if (validated.updates.media !== undefined) {
          updateData.media = validated.updates.media
        }

        if (validated.updates.steps !== undefined) {
          updateData.steps = validated.updates.steps
        }

        transaction.update(experienceRef, updateData)
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate both list and single experience queries
      queryClient.invalidateQueries({
        queryKey: ['workspaceExperiences', variables.workspaceId],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'workspaceExperience',
          variables.workspaceId,
          variables.experienceId,
        ],
      })
    },
    onError: (error, variables) => {
      // Don't report ProfileImmutableError or UpdateDeletedExperienceError to Sentry
      // These are expected user errors, not system errors
      if (
        error instanceof ProfileImmutableError ||
        error instanceof UpdateDeletedExperienceError
      ) {
        return
      }

      Sentry.captureException(error, {
        tags: {
          domain: 'experience',
          action: 'update-experience',
        },
        extra: {
          workspaceId: variables.workspaceId,
          experienceId: variables.experienceId,
          updates: variables.updates,
        },
      })
    },
  })
}
