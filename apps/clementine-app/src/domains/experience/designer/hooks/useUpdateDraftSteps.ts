/**
 * useUpdateDraftSteps Hook
 *
 * Mutation hook for updating the steps array in an experience draft.
 * Used for immediate saves after add/delete/reorder operations.
 * Integrates with editor store for save status tracking.
 * Atomically increments draftVersion on each update using shared helper.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'

import { useExperienceDesignerStore } from '../stores'
import { experienceKeys } from '../../shared/queries/experience.query'
import { updateExperienceConfigField } from '../../shared/lib'
import type { Step } from '../../steps/registry/step-registry'
import { useTrackedMutation } from '@/shared/editor-status'

/**
 * Input for updating draft steps
 */
export interface UpdateDraftStepsInput {
  /** New steps array */
  steps: Step[]
}

/**
 * Hook for updating experience draft steps with immediate save
 *
 * Features:
 * - Saves steps immediately (no debounce)
 * - Tracks save status via editor store
 * - Updates serverTimestamp on each save
 * - Invalidates detail cache on success
 *
 * Use this for discrete operations: add, delete, reorder
 * For config editing, use debounced auto-save via StepConfigPanelContainer
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns Tracked mutation result
 *
 * @example
 * ```tsx
 * function ExperienceDesignerPage({ experience, workspaceId }) {
 *   const updateSteps = useUpdateDraftSteps(workspaceId, experience.id)
 *
 *   const handleAddStep = (type) => {
 *     const newStep = createStep(type)
 *     const newSteps = [...steps, newStep]
 *     setSteps(newSteps)
 *     updateSteps.mutate({ steps: newSteps })
 *   }
 * }
 * ```
 */
export function useUpdateDraftSteps(workspaceId: string, experienceId: string) {
  const queryClient = useQueryClient()
  const store = useExperienceDesignerStore()

  const mutation = useMutation<void, Error, UpdateDraftStepsInput>({
    mutationFn: async ({ steps }) => {
      // Use shared helper for atomic version increment with dot-notation
      await updateExperienceConfigField(workspaceId, experienceId, {
        steps,
      })
    },
    onSuccess: () => {
      // Invalidate detail query to refresh cache
      queryClient.invalidateQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/designer',
          action: 'update-draft-steps',
        },
      })
    },
  })

  // Wrap with tracked mutation for save status
  return useTrackedMutation(mutation, store)
}
