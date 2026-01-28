/**
 * ShareEditorPage Container
 *
 * 2-column layout with live preview (right) and controls (left).
 * Supports both ready and loading state configuration with tab switching.
 * Integrates with auto-save, tracked mutations, and PreviewShell.
 */

import { useCallback, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  ShareConfigPanel,
  ShareLoadingConfigPanel,
  ShareLoadingRenderer,
  ShareReadyRenderer,
} from '../components'
import { useUpdateShareLoading, useUpdateShareReady } from '../hooks'
import { DEFAULT_SHARE_LOADING, DEFAULT_SHARE_READY } from '../constants'
import type {
  CtaConfig,
  ShareLoadingConfig,
  ShareOptionsConfig,
  ShareReadyConfig,
} from '@clementine/shared'
import { Tabs, TabsList, TabsTrigger } from '@/ui-kit/ui/tabs'
import { PreviewShell } from '@/shared/preview-shell'
import { useAutoSave } from '@/shared/forms'
import { useProject } from '@/domains/project/shared'
import { useUpdateShareOptions } from '@/domains/project-config/settings'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'
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
const SHARE_FIELDS_TO_COMPARE: (keyof ShareReadyConfig)[] = [
  'title',
  'description',
  'cta',
]

const SHARE_LOADING_FIELDS_TO_COMPARE: (keyof ShareLoadingConfig)[] = [
  'title',
  'description',
]

// Preview state type
type PreviewState = 'ready' | 'loading'

export function ShareEditorPage() {
  const { projectId } = useParams({ strict: false })
  const { data: project } = useProject(projectId ?? '')

  // Preview state (controls both preview and config panel)
  const [previewState, setPreviewState] = useState<PreviewState>('ready')

  // Get current configs from project or use defaults
  const currentShare: ShareReadyConfig = (project?.draftConfig?.share ??
    DEFAULT_SHARE_READY) as ShareReadyConfig
  const currentShareLoading: ShareLoadingConfig = (project?.draftConfig
    ?.shareLoading ?? DEFAULT_SHARE_LOADING) as ShareLoadingConfig

  // Get current share options from project or use defaults
  const currentShareOptions =
    project?.draftConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // Get current theme from project or use defaults
  const currentTheme = project?.draftConfig?.theme ?? DEFAULT_THEME

  // Forms for both states
  const shareForm = useForm<ShareReadyConfig>({
    defaultValues: currentShare,
    values: currentShare, // Sync form with server data when it changes
  })

  const shareLoadingForm = useForm<ShareLoadingConfig>({
    defaultValues: currentShareLoading,
    values: currentShareLoading, // Sync form with server data when it changes
  })

  // Mutations
  const updateShare = useUpdateShareReady(projectId ?? '')
  const updateShareLoading = useUpdateShareLoading(projectId ?? '')
  const updateShareOptions = useUpdateShareOptions(projectId ?? '')

  // Local state for optimistic UI updates on share options
  const [localShareOptions, setLocalShareOptions] =
    useState<ShareOptionsConfig | null>(null)

  // Use local state for preview if available, otherwise use server state
  const displayShareOptions = localShareOptions ?? currentShareOptions

  // CTA URL validation state
  const [ctaUrlError, setCtaUrlError] = useState<string | null>(null)

  // Auto-save for ready state (existing)
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
    fieldsToCompare: SHARE_FIELDS_TO_COMPARE,
    debounceMs: 2000,
  })

  // Auto-save for loading state (new)
  const { triggerSave: triggerLoadingSave } = useAutoSave({
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

  // Watch both forms for live preview
  const watchedShare = useWatch({
    control: shareForm.control,
  }) as ShareReadyConfig
  const watchedShareLoading = useWatch({
    control: shareLoadingForm.control,
  }) as ShareLoadingConfig

  // Handler for share content updates (ready state)
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

  // Handler for loading state updates (new)
  const handleShareLoadingUpdate = useCallback(
    (updates: Partial<ShareLoadingConfig>) => {
      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        shareLoadingForm.setValue(key as keyof ShareLoadingConfig, value, {
          shouldDirty: true,
        })
      }
      // Trigger debounced save
      triggerLoadingSave()
    },
    [shareLoadingForm, triggerLoadingSave],
  )

  // Handler for CTA updates
  const handleCtaUpdate = useCallback(
    (updates: Partial<CtaConfig>) => {
      const currentCta = shareForm.getValues('cta') ?? {
        label: null,
        url: null,
      }
      const newCta = { ...currentCta, ...updates }
      shareForm.setValue('cta', newCta, { shouldDirty: true })

      // Clear URL error when user types in URL field
      if ('url' in updates) {
        setCtaUrlError(null)
      }

      // Trigger debounced save
      triggerSave()
    },
    [shareForm, triggerSave],
  )

  // URL validation on blur
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

  // Loading state
  if (!project) {
    return null
  }

  // Merge watched values with defaults for complete share object
  const previewShare: ShareReadyConfig = {
    ...DEFAULT_SHARE_READY,
    ...watchedShare,
  }

  const previewShareLoading: ShareLoadingConfig = {
    ...DEFAULT_SHARE_LOADING,
    ...watchedShareLoading,
  }

  return (
    <div className="flex h-full">
      {/* Right: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewShell
          enableViewportSwitcher
          enableFullscreen
          headerSlot={
            <Tabs
              value={previewState}
              onValueChange={(v: string) => setPreviewState(v as PreviewState)}
            >
              <TabsList>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <ThemeProvider theme={currentTheme}>
            {previewState === 'loading' ? (
              <ShareLoadingRenderer shareLoading={previewShareLoading} />
            ) : (
              <ShareReadyRenderer
                share={previewShare}
                shareOptions={displayShareOptions}
              />
            )}
          </ThemeProvider>
        </PreviewShell>
      </div>

      {/* Left: Controls */}
      <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold">
            Share
            <span> · {previewState === 'ready' ? 'Ready' : 'Loading'}</span>
          </h2>
        </div>

        {previewState === 'ready' ? (
          <ShareConfigPanel
            share={previewShare}
            shareOptions={displayShareOptions}
            onShareUpdate={handleShareUpdate}
            onCtaUpdate={handleCtaUpdate}
            onShareOptionToggle={handleShareOptionToggle}
            ctaUrlError={ctaUrlError}
            onCtaUrlBlur={handleCtaUrlBlur}
          />
        ) : (
          <ShareLoadingConfigPanel
            shareLoading={previewShareLoading}
            onShareLoadingUpdate={handleShareLoadingUpdate}
          />
        )}
      </aside>
    </div>
  )
}
