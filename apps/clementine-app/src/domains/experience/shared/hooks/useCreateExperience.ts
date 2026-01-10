/**
 * useCreateExperience Hook
 *
 * Mutation hook for creating new workspace experiences.
 * Uses transaction to ensure serverTimestamp() resolves before returning,
 * preventing Zod parse errors from real-time listeners.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { experienceProfileSchema } from '../schemas'
import type { WithFieldValue } from 'firebase/firestore'
import type { WorkspaceExperience } from '../schemas'
import type {
  CreateExperienceInput,
  CreateExperienceResult,
} from '../types/workspace-experience.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input validation schema for creating an experience
 */
const createExperienceInputSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100),
  profile: experienceProfileSchema,
  media: z
    .object({
      mediaAssetId: z.string(),
      url: z.string().url(),
    })
    .nullable()
    .optional(),
  steps: z.array(z.unknown()).optional(),
})

/**
 * Create workspace experience mutation (admin-only operation)
 *
 * Creates a new workspace experience with name and profile.
 * Uses transaction to ensure serverTimestamp() resolves before returning.
 * Security enforced via Firestore rules.
 *
 * @example
 * ```tsx
 * const createExperience = useCreateExperience()
 *
 * const handleCreate = async () => {
 *   const result = await createExperience.mutateAsync({
 *     workspaceId: 'ws-123',
 *     name: 'My Survey',
 *     profile: 'survey',
 *   })
 *   console.log('Created:', result.experienceId)
 * }
 * ```
 */
export function useCreateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: CreateExperienceInput,
    ): Promise<CreateExperienceResult> => {
      // Validate input
      const validated = createExperienceInputSchema.parse(input)

      const experiencesRef = collection(
        firestore,
        `workspaces/${validated.workspaceId}/experiences`,
      )

      // Use transaction to ensure serverTimestamp() resolves before returning
      return await runTransaction(firestore, (transaction) => {
        const newExperienceRef = doc(experiencesRef)

        const newExperience: WithFieldValue<WorkspaceExperience> = {
          id: newExperienceRef.id,
          name: validated.name,
          status: 'active' as const,
          profile: validated.profile,
          media: validated.media ?? null,
          steps: validated.steps ?? [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null,
        }

        transaction.set(newExperienceRef, newExperience)

        return Promise.resolve({
          experienceId: newExperienceRef.id,
          workspaceId: validated.workspaceId,
        })
      })
    },
    onSuccess: (result) => {
      // Invalidate workspace experiences list
      queryClient.invalidateQueries({
        queryKey: ['workspaceExperiences', result.workspaceId],
      })
    },
    onError: (error, variables) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience',
          action: 'create-experience',
        },
        extra: {
          workspaceId: variables.workspaceId,
          experienceName: variables.name,
          profile: variables.profile,
        },
      })
    },
  })
}
