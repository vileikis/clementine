/**
 * AIPresetEditorLayout Container
 *
 * Domain-owned layout for AI preset editor. Handles save workflow
 * and integrates TopNavBar with two-column editor content.
 */
import { useCallback, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { AIPresetNameBadge } from '../components/AIPresetNameBadge'
import { MediaRegistrySection } from '../components/MediaRegistrySection'
import { ModelSettingsSection } from '../components/ModelSettingsSection'
import { useUpdateAIPreset } from '../hooks/useUpdateAIPreset'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import type { AddMediaResult } from '../components/AddMediaDialog'
import type {
  AIModel,
  AIPreset,
  AspectRatio,
  PresetMediaEntry,
} from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { TopNavBar } from '@/domains/navigation'
import { EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

interface AIPresetEditorLayoutProps {
  preset: AIPreset
  workspaceSlug: string
  workspaceId: string
}

/**
 * AI preset editor layout with domain-owned UI
 *
 * Features:
 * - TopNavBar with breadcrumbs (AI Presets → Preset Name)
 * - Inline editable preset name in breadcrumb
 * - Save status indicator (spinner/checkmark)
 * - Save button for explicit save
 * - Two-column layout for configuration
 *
 * @example
 * ```tsx
 * function PresetEditorRoute() {
 *   const { preset, workspaceSlug, workspaceId } = Route.useLoaderData()
 *   return (
 *     <AIPresetEditorLayout
 *       preset={preset}
 *       workspaceSlug={workspaceSlug}
 *       workspaceId={workspaceId}
 *     />
 *   )
 * }
 * ```
 */
export function AIPresetEditorLayout({
  preset,
  workspaceSlug,
  workspaceId,
}: AIPresetEditorLayoutProps) {
  const { user } = useAuth()
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useAIPresetEditorStore()
  const updatePreset = useUpdateAIPreset(workspaceId, preset.id)

  // Compute paths for breadcrumb navigation
  const presetsPath = `/workspace/${workspaceSlug}/ai-presets`

  // Cleanup: reset save state on unmount
  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

  // Handle name change from badge
  const handleNameChange = useCallback(
    async (name: string) => {
      try {
        await updatePreset.mutateAsync({ name })
      } catch (error) {
        toast.error('Failed to update preset name', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updatePreset],
  )

  // Handle model change
  const handleModelChange = useCallback(
    async (model: AIModel) => {
      try {
        await updatePreset.mutateAsync({ model })
      } catch (error) {
        toast.error('Failed to update model', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updatePreset.mutateAsync],
  )

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    async (aspectRatio: AspectRatio) => {
      try {
        await updatePreset.mutateAsync({ aspectRatio })
      } catch (error) {
        toast.error('Failed to update aspect ratio', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updatePreset.mutateAsync],
  )

  // Handle adding media to registry
  const handleAddMedia = useCallback(
    async (media: AddMediaResult) => {
      try {
        const newEntry: PresetMediaEntry = {
          mediaAssetId: media.mediaAssetId,
          url: media.url,
          filePath: media.filePath,
          name: media.name,
        }
        const updatedRegistry = [...preset.mediaRegistry, newEntry]
        await updatePreset.mutateAsync({ mediaRegistry: updatedRegistry })
        toast.success(`Added @${media.name} to media registry`)
      } catch (error) {
        toast.error('Failed to add media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [preset.mediaRegistry, updatePreset.mutateAsync],
  )

  // Handle renaming media in registry
  const handleRenameMedia = useCallback(
    async (oldName: string, newName: string) => {
      try {
        const updatedRegistry = preset.mediaRegistry.map((m) =>
          m.name === oldName ? { ...m, name: newName } : m,
        )
        await updatePreset.mutateAsync({ mediaRegistry: updatedRegistry })
        toast.success(`Renamed @${oldName} to @${newName}`)
      } catch (error) {
        toast.error('Failed to rename media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [preset.mediaRegistry, updatePreset.mutateAsync],
  )

  // Handle removing media from registry
  const handleDeleteMedia = useCallback(
    async (name: string) => {
      try {
        const updatedRegistry = preset.mediaRegistry.filter(
          (m) => m.name !== name,
        )
        await updatePreset.mutateAsync({ mediaRegistry: updatedRegistry })
        toast.success(`Removed @${name} from media registry`)
      } catch (error) {
        toast.error('Failed to remove media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [preset.mediaRegistry, updatePreset.mutateAsync],
  )

  // Handle explicit save button click
  const handleSave = useCallback(() => {
    // Currently the editor uses auto-save, so this is a no-op
    // In the future, this could trigger immediate save of pending changes
    toast.success('All changes saved')
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <TopNavBar
        className="shrink-0"
        breadcrumbs={[
          {
            label: (
              <AIPresetNameBadge
                preset={preset}
                onNameChange={handleNameChange}
                disabled={updatePreset.isPending}
              />
            ),
            icon: Sparkles,
            iconHref: presetsPath,
          },
        ]}
        right={
          <>
            <EditorSaveStatus
              pendingSaves={pendingSaves}
              lastCompletedAt={lastCompletedAt}
            />
            <Button onClick={handleSave} disabled={pendingSaves > 0}>
              {pendingSaves > 0 && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </>
        }
      />

      {/* Two-column editor content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Configuration */}
        <div className="flex w-[400px] flex-col gap-6 overflow-y-auto border-r p-6">
          {/* Model Settings Section */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Model Settings
            </h2>
            <ModelSettingsSection
              model={preset.model}
              aspectRatio={preset.aspectRatio}
              onModelChange={handleModelChange}
              onAspectRatioChange={handleAspectRatioChange}
              disabled={updatePreset.isPending}
            />
          </section>

          {/* Media Registry Section */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Media Registry
            </h2>
            <MediaRegistrySection
              mediaRegistry={preset.mediaRegistry}
              onAdd={handleAddMedia}
              onRename={handleRenameMedia}
              onDelete={handleDeleteMedia}
              disabled={updatePreset.isPending}
              workspaceId={workspaceId}
              userId={user?.uid ?? ''}
            />
          </section>

          {/* Variables Section - placeholder for Phase 6 */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Variables
            </h2>
            <div className="text-sm text-muted-foreground">
              Variables will be added in Phase 6.
            </div>
          </section>
        </div>

        {/* Right panel - Prompt Template */}
        <div className="flex-1 overflow-y-auto p-6">
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Prompt Template
            </h2>
            <div className="text-sm text-muted-foreground">
              Prompt template editor will be added in Phase 8.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
