/**
 * useShareOptionsForm Hook
 *
 * Encapsulates share options toggle management with optimistic updates.
 * Handles local state for instant preview feedback and server sync.
 */

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { ShareOptionsConfig } from '@clementine/shared'
import { useUpdateShareOptions } from '@/domains/project-config/settings'

export interface UseShareOptionsFormProps {
  /** Project ID for mutations */
  projectId: string
  /** Current share options from server */
  currentShareOptions: ShareOptionsConfig
}

export interface UseShareOptionsFormReturn {
  /** Display share options (optimistic local state or server state) */
  displayShareOptions: ShareOptionsConfig
  /** Handler for toggling share option fields */
  handleShareOptionToggle: (field: keyof ShareOptionsConfig) => Promise<void>
}

/**
 * Manages share options with optimistic updates for instant preview
 */
export function useShareOptionsForm({
  projectId,
  currentShareOptions,
}: UseShareOptionsFormProps): UseShareOptionsFormReturn {
  // Mutation
  const updateShareOptions = useUpdateShareOptions(projectId)

  // Local state for optimistic UI updates
  const [localShareOptions, setLocalShareOptions] =
    useState<ShareOptionsConfig | null>(null)

  // Use local state for preview if available, otherwise use server state
  const displayShareOptions = localShareOptions ?? currentShareOptions

  // Handler for share option toggles
  const handleShareOptionToggle = useCallback(
    async (field: keyof ShareOptionsConfig) => {
      const currentValue = displayShareOptions[field]
      const newValue = !currentValue

      // Optimistic update for instant preview feedback
      setLocalShareOptions((prev) => ({
        ...(prev ?? currentShareOptions),
        [field]: newValue,
      }))

      try {
        await updateShareOptions.mutateAsync({ [field]: newValue })
        // Clear local state after successful save (let server state take over)
        setLocalShareOptions(null)
      } catch (error) {
        // Revert optimistic update on error
        setLocalShareOptions(null)
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save sharing option'
        toast.error(message)
      }
    },
    [displayShareOptions, currentShareOptions, updateShareOptions.mutateAsync],
  )

  return {
    displayShareOptions,
    handleShareOptionToggle,
  }
}
