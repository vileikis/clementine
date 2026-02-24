/**
 * useCreateExperience Hook
 *
 * Mutation hook for creating a new experience in a workspace.
 * Creates the experience with a unified `type` field and initializes
 * the active type's default config on the draft.
 *
 * @see specs/081-experience-type-flattening — US1
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

import type {
  Experience,
  ExperienceConfig,
  ExperienceType,
} from '@clementine/shared'
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
 * Build default draft config for a given experience type.
 * Per contracts/firestore-schema.md: all per-type configs are null except the
 * active type's config which gets initialized with defaults.
 */
function buildDefaultDraft(
  type: ExperienceType,
): WithFieldValue<ExperienceConfig> {
  const base = {
    steps: [] as WithFieldValue<ExperienceConfig>['steps'],
    photo: null,
    gif: null,
    video: null,
    aiImage: null,
    aiVideo: null,
  } satisfies WithFieldValue<ExperienceConfig>

  switch (type) {
    case 'ai.image':
      return {
        ...base,
        aiImage: {
          task: 'text-to-image' as const,
          captureStepId: null,
          aspectRatio: '1:1' as const,
          imageGeneration: {
            prompt: '',
            model: 'gemini-2.5-flash-image' as const,
            refMedia: [],
            aspectRatio: null,
          },
        },
      }
    case 'ai.video':
      return {
        ...base,
        aiVideo: {
          task: 'image-to-video' as const,
          captureStepId: '',
          aspectRatio: '9:16' as const,
          startFrameImageGen: null,
          endFrameImageGen: null,
          videoGeneration: {
            prompt: '',
            model: 'veo-3.1-fast-generate-001' as const,
            duration: 6,
            aspectRatio: null,
            refMedia: [],
          },
        },
      }
    case 'photo':
      return {
        ...base,
        photo: {
          captureStepId: '',
          aspectRatio: '1:1' as const,
        },
      }
    // Survey, gif, video — no active config at creation
    default:
      return base
  }
}

/**
 * Hook for creating a new experience
 *
 * Features:
 * - Validates input with Zod schema
 * - Creates document in transaction with serverTimestamp()
 * - Initializes with status: 'active', draft with type-specific defaults
 * - Invalidates experiences list cache on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
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
      return await runTransaction(firestore, (transaction) => {
        const newRef = doc(experiencesRef)

        const newExperience: WithFieldValue<Experience> = {
          id: newRef.id,
          name: validated.name,
          type: validated.type,
          status: 'active',
          media: null,
          draft: buildDefaultDraft(validated.type),
          published: null,
          draftVersion: 1,
          publishedVersion: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publishedAt: null,
          publishedBy: null,
          deletedAt: null,
        }

        transaction.set(newRef, newExperience)

        return Promise.resolve({
          experienceId: newRef.id,
          workspaceId: validated.workspaceId,
        })
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
