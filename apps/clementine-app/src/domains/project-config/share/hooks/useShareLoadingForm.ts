/**
 * useShareLoadingForm Hook
 *
 * Encapsulates share loading state form management, auto-save, and update handlers.
 * Reduces complexity in ShareEditorPage by centralizing all loading state form logic.
 */

import { useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useUpdateShareLoading } from './useUpdateShareLoading'
import type { ShareLoadingConfig } from '@clementine/shared'
import { useAutoSave } from '@/shared/forms'

// Fields to compare for auto-save change detection
const SHARE_LOADING_FIELDS_TO_COMPARE: (keyof ShareLoadingConfig)[] = [
  'title',
  'description',
  'emailCapture',
]

export interface UseShareLoadingFormProps {
  /** Project ID for mutations */
  projectId: string
  /** Current share loading config from server */
  currentShareLoading: ShareLoadingConfig
}

export interface UseShareLoadingFormReturn {
  /** React Hook Form instance */
  shareLoadingForm: ReturnType<typeof useForm<ShareLoadingConfig>>
  /** Live watched form values for preview */
  watchedShareLoading: ShareLoadingConfig
  /** Handler for updating share loading config fields */
  handleShareLoadingUpdate: (updates: Partial<ShareLoadingConfig>) => void
}

/**
 * Manages share loading state form with auto-save and live preview
 */
export function useShareLoadingForm({
  projectId,
  currentShareLoading,
}: UseShareLoadingFormProps): UseShareLoadingFormReturn {
  // Form setup
  const shareLoadingForm = useForm<ShareLoadingConfig>({
    defaultValues: currentShareLoading,
    values: currentShareLoading, // Sync form with server data when it changes
    resetOptions: {
      keepDirtyValues: true, // Preserve user edits during reset
      keepErrors: true, // Preserve validation errors
    },
  })

  // Mutation
  const updateShareLoading = useUpdateShareLoading(projectId)

  // Auto-save configuration
  const { triggerSave } = useAutoSave({
    form: shareLoadingForm,
    originalValues: currentShareLoading,
    onUpdate: async () => {
      try {
        // Push complete shareLoading object
        const fullShareLoading = shareLoadingForm.getValues()
        await updateShareLoading.mutateAsync(fullShareLoading)
        // No toast - save indicator handles feedback
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save loading config'
        toast.error(message)
      }
    },
    fieldsToCompare: SHARE_LOADING_FIELDS_TO_COMPARE,
    debounceMs: 2000,
  })

  // Watch form for live preview
  const watchedShareLoading = useWatch({
    control: shareLoadingForm.control,
  }) as ShareLoadingConfig

  // Handler for loading state updates
  const handleShareLoadingUpdate = useCallback(
    (updates: Partial<ShareLoadingConfig>) => {
      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        shareLoadingForm.setValue(key as keyof ShareLoadingConfig, value, {
          shouldDirty: true,
        })
      }
      // Trigger debounced save
      triggerSave()
    },
    [shareLoadingForm, triggerSave],
  )

  return {
    shareLoadingForm,
    watchedShareLoading,
    handleShareLoadingUpdate,
  }
}
