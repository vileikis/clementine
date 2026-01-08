/**
 * WelcomeEditorPage Container
 *
 * 2-column layout with live preview (left) and controls (right).
 * Integrates with auto-save, tracked mutations, and PreviewShell.
 */

import { useCallback, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { WelcomeControls, WelcomePreview } from '../components'
import { useUpdateWelcome, useUploadAndUpdateHeroMedia } from '../hooks'
import { DEFAULT_WELCOME } from '../constants'
import type { WelcomeConfig } from '@/domains/event/shared'
import { PreviewShell } from '@/shared/preview-shell'
import { useAutoSave } from '@/shared/forms'
import { useProjectEvent } from '@/domains/event/shared'
import { useWorkspace } from '@/domains/workspace'
import { useAuth } from '@/domains/auth'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'
import { ThemeProvider } from '@/shared/theming'

// Fields to compare for auto-save change detection
const WELCOME_FIELDS_TO_COMPARE: (keyof WelcomeConfig)[] = [
  'title',
  'description',
  'media',
  'layout',
]

export function WelcomeEditorPage() {
  const { projectId, eventId, workspaceSlug } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | undefined>()
  const [isUploading, setIsUploading] = useState(false)

  // Get current welcome from event or use defaults
  const currentWelcome = event?.draftConfig?.welcome ?? DEFAULT_WELCOME

  // Get current theme from event or use defaults
  const currentTheme = event?.draftConfig?.theme ?? DEFAULT_THEME

  // Form setup
  const form = useForm<WelcomeConfig>({
    defaultValues: currentWelcome,
    values: currentWelcome, // Sync form with server data when it changes
  })

  // Mutations
  const updateWelcome = useUpdateWelcome(projectId!, eventId!)
  const uploadHeroMedia = useUploadAndUpdateHeroMedia(
    workspace?.id ?? '',
    user?.uid ?? '',
  )

  // Auto-save with debounce
  const { triggerSave } = useAutoSave({
    form,
    originalValues: currentWelcome,
    onUpdate: async () => {
      try {
        // Push complete welcome object (not partial updates)
        const fullWelcome = form.getValues()
        await updateWelcome.mutateAsync(fullWelcome)
        // No toast - save indicator handles feedback
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save welcome'
        toast.error(message)
      }
    },
    fieldsToCompare: WELCOME_FIELDS_TO_COMPARE,
    debounceMs: 2000,
  })

  // Watch form values for live preview
  const watchedWelcome = useWatch({ control: form.control }) as WelcomeConfig

  // Handler for control updates
  const handleUpdate = useCallback(
    (updates: Partial<WelcomeConfig>) => {
      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        form.setValue(key as keyof WelcomeConfig, value, {
          shouldDirty: true,
        })
      }
      // Trigger debounced save
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handler for hero media upload
  const handleUploadHeroMedia = useCallback(
    async (file: File) => {
      if (!workspace?.id || !user?.uid) {
        toast.error('Missing workspace or user information')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const { mediaAssetId, url } = await uploadHeroMedia.mutateAsync({
          file,
          onProgress: (progress) => setUploadProgress(progress),
        })

        // Update form with full MediaReference object and trigger save
        form.setValue('media', { mediaAssetId, url }, { shouldDirty: true })
        triggerSave()
        toast.success('Hero image uploaded')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to upload hero image'
        toast.error(message)
      } finally {
        setIsUploading(false)
        setUploadProgress(undefined)
      }
    },
    [uploadHeroMedia, form, workspace?.id, user?.uid, triggerSave],
  )

  // Loading state
  if (!event || !user || !workspace) {
    return null
  }

  // Merge watched values with defaults for complete welcome object
  const previewWelcome: WelcomeConfig = {
    ...DEFAULT_WELCOME,
    ...watchedWelcome,
  }

  return (
    <div className="flex h-full">
      {/* Left: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemeProvider theme={currentTheme}>
            <WelcomePreview welcome={previewWelcome} />
          </ThemeProvider>
        </PreviewShell>
      </div>

      {/* Right: Controls */}
      <aside className="w-80 shrink-0 border-l border-border overflow-y-auto bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold">Welcome</h2>
        </div>
        <WelcomeControls
          welcome={previewWelcome}
          onUpdate={handleUpdate}
          onUploadHeroMedia={handleUploadHeroMedia}
          uploadingHeroMedia={isUploading}
          uploadProgress={uploadProgress}
        />
      </aside>
    </div>
  )
}
