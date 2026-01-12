/**
 * useCreateExperience Hook
 *
 * Mutation hook for creating a new experience in a workspace.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { createExperienceInputSchema } from '../schemas/experience.input.schemas'
import { experienceKeys } from '../queries/experience.query'
import type { WithFieldValue } from 'firebase/firestore'

import type { Experience } from '../schemas/experience.schema'
import type { CreateExperienceInput } from '../schemas/experience.input.schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Result returned on successful experience creation
 */
export interface CreateExperienceResult {
  /** Created experience document ID */
  experienceId: string
  /** Workspace ID for cache invalidation */
  workspaceId: string
}

/**
 * Hook for creating a new experience
 *
 * Features:
 * - Validates input with Zod schema
 * - Creates document in transaction with serverTimestamp()
 * - Initializes with status: 'active', draft: { steps: [] }, published: null
 * - Invalidates experiences list cache on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function CreateExperienceForm({ workspaceId }) {
 *   const createExperience = useCreateExperience()
 *
 *   const handleSubmit = async (data) => {
 *     try {
 *       const result = await createExperience.mutateAsync({
 *         workspaceId,
 *         name: data.name,
 *         profile: data.profile,
 *       })
 *       navigate(`/experiences/${result.experienceId}`)
 *     } catch {
 *       toast.error('Failed to create experience')
 *     }
 *   }
 * }
 * ```
 */
export function useCreateExperience() {
  const queryClient = useQueryClient()

  return useMutation<CreateExperienceResult, Error, CreateExperienceInput>({
    mutationFn: async (input) => {
      // Validate input
      const validated = createExperienceInputSchema.parse(input)

      const experiencesRef = collection(
        firestore,
        `workspaces/${validated.workspaceId}/experiences`,
      )

      // Create in transaction to ensure serverTimestamp() resolves correctly
      return await runTransaction(firestore, async (transaction) => {
        const newRef = doc(experiencesRef)

        const newExperience: WithFieldValue<Experience> = {
          id: newRef.id,
          name: validated.name,
          profile: validated.profile,
          status: 'active',
          media: null,
          draft: { steps: [] },
          published: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publishedAt: null,
          publishedBy: null,
          deletedAt: null,
        }

        transaction.set(newRef, newExperience)

        return {
          experienceId: newRef.id,
          workspaceId: validated.workspaceId,
        }
      })
    },
    onSuccess: ({ workspaceId }) => {
      // Invalidate all experience lists for this workspace
      queryClient.invalidateQueries({
        queryKey: experienceKeys.lists(),
        predicate: (query) => {
          const key = query.queryKey as string[]
          return key[2] === workspaceId
        },
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/library',
          action: 'create-experience',
        },
      })
    },
  })
}
