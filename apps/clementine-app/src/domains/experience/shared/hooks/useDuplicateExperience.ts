/**
 * useDuplicateExperience Hook
 *
 * Mutation hook for duplicating an existing experience in a workspace.
 * Creates a deep copy with configuration preserved but in an unpublished state.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { duplicateExperienceInputSchema } from '../schemas/experience.input.schemas'
import { experienceKeys } from '../queries/experience.query'
import type { WithFieldValue } from 'firebase/firestore'

import type { Experience } from '../schemas'
import type { DuplicateExperienceInput } from '../schemas/experience.input.schemas'
import { generateDuplicateName } from '@/shared/utils/generate-duplicate-name'
import { firestore } from '@/integrations/firebase/client'

/**
 * Result returned on successful experience duplication
 */
export interface DuplicateExperienceResult {
  /** Workspace ID for cache invalidation */
  workspaceId: string
  /** Created experience document ID */
  experienceId: string
  /** Generated name for the duplicate */
  name: string
}

/**
 * Hook for duplicating an existing experience
 *
 * Features:
 * - Validates input with Zod schema
 * - Reads source experience in a transaction
 * - Deep-copies draft and published configs with structuredClone()
 * - Creates new document with "(Copy)" name suffix
 * - Resets publish state (unpublished)
 * - Invalidates experiences list cache on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 */
export function useDuplicateExperience() {
  const queryClient = useQueryClient()

  return useMutation<
    DuplicateExperienceResult,
    Error,
    DuplicateExperienceInput
  >({
    mutationFn: async (input) => {
      const validated = duplicateExperienceInputSchema.parse(input)

      const experiencesRef = collection(
        firestore,
        `workspaces/${validated.workspaceId}/experiences`,
      )

      return await runTransaction(firestore, async (transaction) => {
        // Read source experience
        const sourceRef = doc(experiencesRef, validated.experienceId)
        const sourceSnapshot = await transaction.get(sourceRef)

        if (!sourceSnapshot.exists()) {
          throw new Error('Source experience not found')
        }

        const source = sourceSnapshot.data() as Experience

        if (source.status !== 'active') {
          throw new Error('Source experience is not active')
        }

        // Generate duplicate name
        const name = generateDuplicateName(source.name)

        // Create new document reference
        const newRef = doc(experiencesRef)

        const newExperience: WithFieldValue<Experience> = {
          id: newRef.id,
          name,
          status: 'active',
          profile: source.profile,
          media: source.media,
          draft: structuredClone(source.draft),
          published: source.published
            ? structuredClone(source.published)
            : null,
          draftVersion: 1,
          publishedVersion: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publishedAt: null,
          publishedBy: null,
          deletedAt: null,
          sourceExperienceId: source.id,
        }

        transaction.set(newRef, newExperience)

        return {
          workspaceId: validated.workspaceId,
          experienceId: newRef.id,
          name,
        }
      })
    },
    onSuccess: ({ workspaceId }) => {
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
          action: 'duplicate-experience',
        },
      })
    },
  })
}
