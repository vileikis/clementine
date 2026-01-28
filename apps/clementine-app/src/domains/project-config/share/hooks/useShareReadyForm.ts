/**
 * useShareReadyForm Hook
 *
 * Encapsulates share ready state form management, auto-save, and update handlers.
 * Reduces complexity in ShareEditorPage by centralizing all ready state form logic.
 */

import { useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useUpdateShareReady } from './useUpdateShareReady'
import type { ShareReadyConfig } from '@clementine/shared'
import { useAutoSave } from '@/shared/forms'

// Fields to compare for auto-save change detection
const SHARE_READY_FIELDS_TO_COMPARE: (keyof ShareReadyConfig)[] = [
  'title',
  'description',
  'cta',
]

export interface UseShareReadyFormProps {
  /** Project ID for mutations */
  projectId: string
  /** Current share ready config from server */
  currentShare: ShareReadyConfig
}

export interface UseShareReadyFormReturn {
  /** React Hook Form instance */
  shareForm: ReturnType<typeof useForm<ShareReadyConfig>>
  /** Live watched form values for preview */
  watchedShare: ShareReadyConfig
  /** Handler for updating share ready config fields */
  handleShareUpdate: (updates: Partial<ShareReadyConfig>) => void
}

/**
 * Manages share ready state form with auto-save and live preview
 */
export function useShareReadyForm({
  projectId,
  currentShare,
}: UseShareReadyFormProps): UseShareReadyFormReturn {
  // Form setup
  const shareForm = useForm<ShareReadyConfig>({
    defaultValues: currentShare,
    values: currentShare, // Sync form with server data when it changes
  })

  // Mutation
  const updateShare = useUpdateShareReady(projectId)

  // Auto-save configuration
  const { triggerSave } = useAutoSave({
    form: shareForm,
    originalValues: currentShare,
    onUpdate: async () => {
      try {
        // Push complete share object (not partial updates)
        const fullShare = shareForm.getValues()
        await updateShare.mutateAsync(fullShare)
        // No toast - save indicator handles feedback
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save share config'
        toast.error(message)
      }
    },
    fieldsToCompare: SHARE_READY_FIELDS_TO_COMPARE,
    debounceMs: 2000,
  })

  // Watch form for live preview
  const watchedShare = useWatch({
    control: shareForm.control,
  }) as ShareReadyConfig

  // Handler for share content updates
  const handleShareUpdate = useCallback(
    (updates: Partial<ShareReadyConfig>) => {
      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        shareForm.setValue(key as keyof ShareReadyConfig, value, {
          shouldDirty: true,
        })
      }
      // Trigger debounced save
      triggerSave()
    },
    [shareForm, triggerSave],
  )

  return {
    shareForm,
    watchedShare,
    handleShareUpdate,
  }
}
