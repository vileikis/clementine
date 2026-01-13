/**
 * ShareEditorPage Container
 *
 * 2-column layout with live preview (right) and controls (left).
 * Integrates with auto-save, tracked mutations, and PreviewShell.
 */

import { useCallback, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ShareConfigPanel } from '../components/ShareConfigPanel'
import { SharePreview } from '../components/SharePreview'
import { useUpdateShare } from '../hooks'
import { DEFAULT_SHARE } from '../constants'
import type {
  CtaConfig,
  ShareConfig,
  ShareOptionsConfig,
} from '@/domains/event/shared'
import { PreviewShell } from '@/shared/preview-shell'
import { useAutoSave } from '@/shared/forms'
import { useProjectEvent } from '@/domains/event/shared'
import { useUpdateShareOptions } from '@/domains/event/settings'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'
import { ThemeProvider } from '@/shared/theming'

// Default share options when none exist
const DEFAULT_SHARE_OPTIONS: ShareOptionsConfig = {
  download: true,
  copyLink: true,
  email: false,
  instagram: false,
  facebook: false,
  linkedin: false,
  twitter: false,
  tiktok: false,
  telegram: false,
}

// Fields to compare for auto-save change detection
const SHARE_FIELDS_TO_COMPARE: (keyof ShareConfig)[] = [
  'title',
  'description',
  'cta',
]

export function ShareEditorPage() {
  const { projectId, eventId } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)

  // Get current share from event or use defaults
  const currentShare = event?.draftConfig?.share ?? DEFAULT_SHARE

  // Get current share options from event or use defaults
  // Fall back to 'sharing' for backward compatibility
  const currentShareOptions =
    event?.draftConfig?.shareOptions ??
    event?.draftConfig?.sharing ??
    DEFAULT_SHARE_OPTIONS

  // Get current theme from event or use defaults
  const currentTheme = event?.draftConfig?.theme ?? DEFAULT_THEME

  // Form setup
  const form = useForm<ShareConfig>({
    defaultValues: currentShare,
    values: currentShare, // Sync form with server data when it changes
  })

  // Mutations
  const updateShare = useUpdateShare(projectId!, eventId!)
  const updateShareOptions = useUpdateShareOptions(projectId!, eventId!)

  // Local state for optimistic UI updates on share options
  const [localShareOptions, setLocalShareOptions] =
    useState<ShareOptionsConfig | null>(null)

  // Use local state for preview if available, otherwise use server state
  const displayShareOptions = localShareOptions ?? currentShareOptions

  // CTA URL validation state
  const [ctaUrlError, setCtaUrlError] = useState<string | null>(null)

  // Auto-save with debounce
  const { triggerSave } = useAutoSave({
    form,
    originalValues: currentShare,
    onUpdate: async () => {
      try {
        // Push complete share object (not partial updates)
        const fullShare = form.getValues()
        await updateShare.mutateAsync(fullShare)
        // No toast - save indicator handles feedback
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save share config'
        toast.error(message)
      }
    },
    fieldsToCompare: SHARE_FIELDS_TO_COMPARE,
    debounceMs: 2000,
  })

  // Watch form values for live preview
  const watchedShare = useWatch({ control: form.control }) as ShareConfig

  // Handler for share content updates
  const handleShareUpdate = useCallback(
    (updates: Partial<ShareConfig>) => {
      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        form.setValue(key as keyof ShareConfig, value, {
          shouldDirty: true,
        })
      }
      // Trigger debounced save
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handler for CTA updates
  const handleCtaUpdate = useCallback(
    (updates: Partial<CtaConfig>) => {
      const currentCta = form.getValues('cta') ?? { label: null, url: null }
      const newCta = { ...currentCta, ...updates }
      form.setValue('cta', newCta, { shouldDirty: true })

      // Clear URL error when user types in URL field
      if ('url' in updates) {
        setCtaUrlError(null)
      }

      // Trigger debounced save
      triggerSave()
    },
    [form, triggerSave],
  )

  // URL validation on blur
  const handleCtaUrlBlur = useCallback(() => {
    const cta = form.getValues('cta')
    const hasLabel = cta?.label && cta.label.trim() !== ''
    const hasUrl = cta?.url && cta.url.trim() !== ''

    // If label is provided but URL is missing
    if (hasLabel && !hasUrl) {
      setCtaUrlError('URL is required when button label is provided')
      return
    }

    // If URL is provided, validate format
    if (hasUrl) {
      try {
        new URL(cta.url!)
        setCtaUrlError(null)
      } catch {
        setCtaUrlError('Please enter a valid URL')
      }
    } else {
      setCtaUrlError(null)
    }
  }, [form])

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
    [displayShareOptions, currentShareOptions, updateShareOptions],
  )

  // Loading state
  if (!event) {
    return null
  }

  // Merge watched values with defaults for complete share object
  const previewShare: ShareConfig = {
    ...DEFAULT_SHARE,
    ...watchedShare,
  }

  return (
    <div className="flex h-full">
      {/* Left: Controls */}
      <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold">Share</h2>
        </div>
        <ShareConfigPanel
          share={previewShare}
          shareOptions={displayShareOptions}
          onShareUpdate={handleShareUpdate}
          onCtaUpdate={handleCtaUpdate}
          onShareOptionToggle={handleShareOptionToggle}
          ctaUrlError={ctaUrlError}
          onCtaUrlBlur={handleCtaUrlBlur}
        />
      </aside>

      {/* Right: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemeProvider theme={currentTheme}>
            <SharePreview
              share={previewShare}
              shareOptions={displayShareOptions}
            />
          </ThemeProvider>
        </PreviewShell>
      </div>
    </div>
  )
}
