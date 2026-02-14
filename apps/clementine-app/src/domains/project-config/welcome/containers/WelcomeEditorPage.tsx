/**
 * WelcomeEditorPage Container
 *
 * 2-column layout with live preview (right) and controls (left).
 * Integrates with auto-save, tracked mutations, and PreviewShell.
 */

import { useCallback, useMemo, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { WelcomeConfigPanel, WelcomeRenderer } from '../components'
import { useUpdateWelcome, useUploadAndUpdateHeroMedia } from '../hooks'
import { DEFAULT_WELCOME } from '../constants'
import type { ExperienceCardData } from '../components'
import type { WelcomeConfig } from '@/domains/project-config/shared'
import type { MainExperienceReference } from '@/domains/project-config/experiences'
import { PreviewShell } from '@/shared/preview-shell'
import { useAutoSave } from '@/shared/forms'
import { useProject } from '@/domains/project/shared'
import { useWorkspace } from '@/domains/workspace'
import { useAuth } from '@/domains/auth'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'
import { ThemeProvider, ThemedBackground } from '@/shared/theming'
import { useUpdateProjectExperiences } from '@/domains/project-config/experiences'
import { useExperiencesByIds } from '@/domains/experience/shared'

// Fields to compare for auto-save change detection
const WELCOME_FIELDS_TO_COMPARE: (keyof WelcomeConfig)[] = [
  'title',
  'description',
  'media',
  'layout',
]

export function WelcomeEditorPage() {
  const { projectId, workspaceSlug } = useParams({ strict: false })
  const { data: project } = useProject(projectId ?? '')
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | undefined>()
  const [isUploading, setIsUploading] = useState(false)

  // Get current welcome from project or use defaults
  const currentWelcome = project?.draftConfig?.welcome ?? DEFAULT_WELCOME

  // Get current theme from project or use defaults
  const currentTheme = project?.draftConfig?.theme ?? DEFAULT_THEME

  // Get current experiences from project
  const mainExperiences = project?.draftConfig?.experiences?.main ?? []
  const pregateExperience = project?.draftConfig?.experiences?.pregate
  const preshareExperience = project?.draftConfig?.experiences?.preshare

  // Fetch only the connected experiences by their IDs
  const mainExperienceIds = useMemo(
    () => mainExperiences.map((exp) => exp.experienceId),
    [mainExperiences],
  )
  const { data: connectedExperiences = [] } = useExperiencesByIds(
    workspace?.id ?? '',
    mainExperienceIds,
  )

  // Get all assigned experience IDs across all slots
  const assignedExperienceIds = useMemo(() => {
    const ids: string[] = [...mainExperiences.map((exp) => exp.experienceId)]
    if (pregateExperience) ids.push(pregateExperience.experienceId)
    if (preshareExperience) ids.push(preshareExperience.experienceId)
    return ids
  }, [mainExperiences, pregateExperience, preshareExperience])

  // Map connected experiences to card data format for preview
  const mainExperienceDetails: ExperienceCardData[] = useMemo(() => {
    const experienceMap = new Map(
      connectedExperiences.map((exp) => [exp.id, exp]),
    )
    return mainExperiences
      .map((ref) => experienceMap.get(ref.experienceId))
      .filter((exp): exp is NonNullable<typeof exp> => exp !== undefined)
      .map((exp) => ({
        id: exp.id,
        name: exp.name,
        thumbnailUrl: exp.media?.url ?? null,
      }))
  }, [mainExperiences, connectedExperiences])

  // Form setup
  const form = useForm<WelcomeConfig>({
    defaultValues: currentWelcome,
    values: currentWelcome, // Sync form with server data when it changes
  })

  // Mutations (hooks handle undefined params gracefully)
  const updateWelcome = useUpdateWelcome(projectId)
  const uploadHeroMedia = useUploadAndUpdateHeroMedia(workspace?.id, user?.uid)
  const updateProjectExperiences = useUpdateProjectExperiences({
    projectId,
  })

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
        const { mediaAssetId, url, filePath, displayName } =
          await uploadHeroMedia.mutateAsync({
            file,
            onProgress: (progress) => setUploadProgress(progress),
          })

        // Update form with full MediaReference object and trigger save
        form.setValue(
          'media',
          { mediaAssetId, url, filePath, displayName },
          { shouldDirty: true },
        )
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

  // Handler for updating main experiences
  const handleUpdateMainExperiences = useCallback(
    async (experiences: MainExperienceReference[]) => {
      try {
        await updateProjectExperiences.mutateAsync({ main: experiences })
        // No toast - changes are reflected immediately via real-time updates
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update experiences'
        toast.error(message)
      }
    },
    [updateProjectExperiences],
  )

  // Loading state
  if (!project || !user || !workspace) {
    return null
  }

  // Merge watched values with defaults for complete welcome object
  const previewWelcome: WelcomeConfig = {
    ...DEFAULT_WELCOME,
    ...watchedWelcome,
  }

  return (
    <div className="flex h-full">
      {/* Right: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewShell enableViewportSwitcher enableFullscreen>
          <ThemeProvider theme={currentTheme}>
            <ThemedBackground className="h-full">
              <WelcomeRenderer
                welcome={previewWelcome}
                mainExperiences={mainExperiences}
                experienceDetails={mainExperienceDetails}
                mode="edit"
              />
            </ThemedBackground>
          </ThemeProvider>
        </PreviewShell>
      </div>

      {/* Left: Controls */}
      <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold">Welcome</h2>
        </div>
        <WelcomeConfigPanel
          welcome={previewWelcome}
          onUpdate={handleUpdate}
          onUploadHeroMedia={handleUploadHeroMedia}
          uploadingHeroMedia={isUploading}
          uploadProgress={uploadProgress}
          workspaceId={workspace.id}
          workspaceSlug={workspace.slug}
          mainExperiences={mainExperiences}
          assignedExperienceIds={assignedExperienceIds}
          onUpdateMainExperiences={handleUpdateMainExperiences}
          pregateExperience={pregateExperience}
          preshareExperience={preshareExperience}
        />
      </aside>
    </div>
  )
}
