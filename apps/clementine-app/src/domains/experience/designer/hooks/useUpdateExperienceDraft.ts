/**
 * useUpdateExperienceDraft Hook
 *
 * Mutation hook for updating the draft section of an experience.
 * Used by auto-save to persist step changes with serverTimestamp().
 * Atomically increments draftVersion on each update.
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
import type { ExperienceConfig } from '../../shared/schemas/experience.schema'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input for updating experience draft
 */
export interface UpdateExperienceDraftInput {
  /** Workspace containing the experience */
  workspaceId: string
  /** Experience document ID */
  experienceId: string
  /** Updated draft configuration */
  draft: ExperienceConfig
}

/**
 * Result returned on successful draft update
 */
export interface UpdateExperienceDraftResult {
  /** Updated experience document ID */
  experienceId: string
  /** Workspace ID for cache invalidation */
  workspaceId: string
}

/**
 * Hook for updating experience draft configuration
 *
 * Features:
 * - Updates draft field with serverTimestamp() for updatedAt
 * - Invalidates detail cache on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function ExperienceDesignerPage({ experience }) {
 *   const updateDraft = useUpdateExperienceDraft()
 *
 *   const handleStepsChange = async (steps) => {
 *     await updateDraft.mutateAsync({
 *       workspaceId: experience.workspaceId,
 *       experienceId: experience.id,
 *       draft: { ...experience.draft, steps },
 *     })
 *   }
 * }
 * ```
 */
export function useUpdateExperienceDraft() {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateExperienceDraftResult,
    Error,
    UpdateExperienceDraftInput
  >({
    mutationFn: async (input) => {
      const { workspaceId, experienceId, draft } = input

      const experienceRef = doc(
        firestore,
        `workspaces/${workspaceId}/experiences/${experienceId}`,
      )

      // Update draft with atomic version increment in transaction
      await runTransaction(firestore, (transaction) => {
        transaction.update(experienceRef, {
          draft,
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
          domain: 'experience/designer',
          action: 'update-experience-draft',
        },
      })
    },
  })
}
