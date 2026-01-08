/**
 * ThemeEditorPage Container
 *
 * 2-column layout with live preview (left) and controls (right).
 * Integrates with auto-save, tracked mutations, and PreviewShell.
 */

import { useCallback, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ThemeControls, ThemePreview } from '../components'
import { useUpdateTheme, useUploadAndUpdateBackground } from '../hooks'
import { DEFAULT_THEME } from '../constants'
import type { Theme } from '@/shared/theming'
import { PreviewShell } from '@/shared/preview-shell'
import { useAutoSave } from '@/shared/forms'
import { useProjectEvent } from '@/domains/event/shared'
import { useWorkspace } from '@/domains/workspace'
import { useAuth } from '@/domains/auth'

// Fields to compare for auto-save change detection
const THEME_FIELDS_TO_COMPARE: (keyof Theme)[] = [
  'fontFamily',
  'primaryColor',
  'text',
  'button',
  'background',
]

export function ThemeEditorPage() {
  const { projectId, eventId, workspaceSlug } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | undefined>()
  const [isUploading, setIsUploading] = useState(false)

  // Get current theme from event or use defaults
  const currentTheme = event?.draftConfig?.theme ?? DEFAULT_THEME

  // Form setup
  const form = useForm<Theme>({
    defaultValues: currentTheme,
    values: currentTheme, // Sync form with server data when it changes
  })

  // Mutations
  const updateTheme = useUpdateTheme(projectId!, eventId!)
  const uploadBackground = useUploadAndUpdateBackground(
    workspace?.id ?? '',
    user?.uid ?? '',
  )

  // Auto-save with debounce
  const { triggerSave } = useAutoSave({
    form,
    originalValues: currentTheme,
    onUpdate: async () => {
      try {
        // Push complete theme object (not partial updates)
        const fullTheme = form.getValues()
        await updateTheme.mutateAsync(fullTheme)
        // No toast - save indicator handles feedback
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save theme'
        toast.error(message)
      }
    },
    fieldsToCompare: THEME_FIELDS_TO_COMPARE,
    debounceMs: 2000,
  })

  // Watch form values for live preview
  const watchedTheme = useWatch({ control: form.control }) as Theme

  // Handler for control updates
  const handleUpdate = useCallback(
    (updates: Partial<Theme>) => {
      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        form.setValue(key as keyof Theme, value, {
          shouldDirty: true,
        })
      }
      // Trigger debounced save
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handler for background image upload
  const handleUploadBackground = useCallback(
    async (file: File) => {
      if (!workspace?.id || !user?.uid) {
        toast.error('Missing workspace or user information')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const { mediaAssetId, url } = await uploadBackground.mutateAsync({
          file,
          onProgress: (progress) => setUploadProgress(progress),
        })

        // Update form with full MediaReference object and trigger save
        form.setValue(
          'background.image',
          { mediaAssetId, url },
          { shouldDirty: true },
        )
        triggerSave()
        toast.success('Background image uploaded')
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to upload background image'
        toast.error(message)
      } finally {
        setIsUploading(false)
        setUploadProgress(undefined)
      }
    },
    [uploadBackground, form, workspace?.id, user?.uid, triggerSave],
  )

  // Loading state
  if (!event || !user || !workspace) {
    return null
  }

  // Merge watched values with defaults for complete theme object
  const previewTheme: Theme = {
    ...DEFAULT_THEME,
    ...watchedTheme,
    text: { ...DEFAULT_THEME.text, ...watchedTheme.text },
    button: { ...DEFAULT_THEME.button, ...watchedTheme.button },
    background: { ...DEFAULT_THEME.background, ...watchedTheme.background },
  }

  return (
    <div className="flex h-full">
      {/* Left: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemePreview theme={previewTheme} />
        </PreviewShell>
      </div>

      {/* Right: Controls */}
      <aside className="w-80 shrink-0 border-l border-border overflow-y-auto bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold">Theme</h2>
        </div>
        <ThemeControls
          theme={previewTheme}
          onUpdate={handleUpdate}
          onUploadBackground={handleUploadBackground}
          uploadingBackground={isUploading}
          uploadProgress={uploadProgress}
        />
      </aside>
    </div>
  )
}
