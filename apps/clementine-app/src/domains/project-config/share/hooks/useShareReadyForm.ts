/**
 * useShareReadyForm Hook
 *
 * Encapsulates share ready state form management, auto-save, update handlers,
 * and CTA validation. Reduces complexity in ShareEditorPage by centralizing
 * all ready state form logic including CTA-specific concerns.
 */

import { useCallback, useState } from 'react'
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
  currentShareReady: ShareReadyConfig
}

export interface UseShareReadyFormReturn {
  /** React Hook Form instance */
  shareForm: ReturnType<typeof useForm<ShareReadyConfig>>
  /** Live watched form values for preview */
  watchedShare: ShareReadyConfig
  /** Handler for updating share ready config fields */
  handleShareUpdate: (updates: Partial<ShareReadyConfig>) => void
  /** CTA URL validation error message */
  ctaUrlError: string | null
  /** Handler for CTA URL blur event (triggers validation) */
  handleCtaUrlBlur: () => void
  /** Clear CTA URL error (called when user types in URL field) */
  clearCtaUrlError: () => void
}

/**
 * Manages share ready state form with auto-save and live preview
 */
export function useShareReadyForm({
  projectId,
  currentShareReady,
}: UseShareReadyFormProps): UseShareReadyFormReturn {
  // Form setup
  const shareForm = useForm<ShareReadyConfig>({
    defaultValues: currentShareReady,
    values: currentShareReady, // Sync form with server data when it changes
    resetOptions: {
      keepDirtyValues: true, // Preserve user edits during reset
      keepErrors: true, // Preserve validation errors
    },
  })

  // Mutation
  const updateShare = useUpdateShareReady(projectId)

  // Auto-save configuration
  const { triggerSave } = useAutoSave({
    form: shareForm,
    originalValues: currentShareReady,
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

  // CTA validation state
  const [ctaUrlError, setCtaUrlError] = useState<string | null>(null)

  // Clear CTA URL error (called when user types in URL field)
  const clearCtaUrlError = useCallback(() => {
    setCtaUrlError(null)
  }, [])

  // CTA URL validation on blur
  const handleCtaUrlBlur = useCallback(() => {
    const cta = shareForm.getValues('cta')
    const hasLabel = cta?.label && cta.label.trim() !== ''
    const hasUrl = cta?.url && cta.url.trim() !== ''

    // If label is provided but URL is missing
    if (hasLabel && !hasUrl) {
      setCtaUrlError('URL is required when button label is provided')
      return
    }

    // If URL is provided, validate format
    if (hasUrl && cta.url) {
      try {
        new URL(cta.url)
        setCtaUrlError(null)
      } catch {
        setCtaUrlError('Please enter a valid URL')
      }
    } else {
      setCtaUrlError(null)
    }
  }, [shareForm])

  return {
    shareForm,
    watchedShare,
    handleShareUpdate,
    ctaUrlError,
    handleCtaUrlBlur,
    clearCtaUrlError,
  }
}
