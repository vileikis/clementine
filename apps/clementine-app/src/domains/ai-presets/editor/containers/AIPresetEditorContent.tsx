/**
 * AIPresetEditorContent Container
 *
 * Two-column layout containing all editor sections.
 * Receives draft config as prop and calls update handlers.
 *
 * Following Experience Designer pattern:
 * - AIPresetEditorLayout handles TopNavBar, publish, and version tracking
 * - AIPresetEditorContent handles the actual editor content
 */
import { useCallback } from 'react'
import { toast } from 'sonner'

import { MediaRegistrySection } from '../components/MediaRegistrySection'
import { ModelSettingsSection } from '../components/ModelSettingsSection'
import { useUpdateAIPreset } from '../hooks/useUpdateAIPreset'
import type { AddMediaResult } from '../components/AddMediaDialog'
import type {
  AIModel,
  AIPresetConfig,
  AspectRatio,
  PresetMediaEntry,
} from '@clementine/shared'

interface AIPresetEditorContentProps {
  draft: AIPresetConfig
  workspaceId: string
  presetId: string
  userId: string
  disabled?: boolean
}

/**
 * AI preset editor content with two-column layout
 *
 * Left panel: Configuration sections (model, media, variables)
 * Right panel: Prompt template editor (Phase 8)
 *
 * @example
 * ```tsx
 * <AIPresetEditorContent
 *   draft={preset.draft}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   userId={user.uid}
 *   disabled={isPending}
 * />
 * ```
 */
export function AIPresetEditorContent({
  draft,
  workspaceId,
  presetId,
  userId,
  disabled = false,
}: AIPresetEditorContentProps) {
  const updatePreset = useUpdateAIPreset(workspaceId, presetId)

  // Handle model change
  const handleModelChange = useCallback(
    async (model: AIModel) => {
      try {
        await updatePreset.mutateAsync({ draft: { model } })
      } catch (error) {
        toast.error('Failed to update model', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updatePreset],
  )

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    async (aspectRatio: AspectRatio) => {
      try {
        await updatePreset.mutateAsync({ draft: { aspectRatio } })
      } catch (error) {
        toast.error('Failed to update aspect ratio', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updatePreset],
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
        const updatedRegistry = [...draft.mediaRegistry, newEntry]
        await updatePreset.mutateAsync({
          draft: { mediaRegistry: updatedRegistry },
        })
        toast.success(`Added @${media.name} to media registry`)
      } catch (error) {
        toast.error('Failed to add media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [draft.mediaRegistry, updatePreset],
  )

  // Handle renaming media in registry
  const handleRenameMedia = useCallback(
    async (oldName: string, newName: string) => {
      try {
        const updatedRegistry = draft.mediaRegistry.map((m) =>
          m.name === oldName ? { ...m, name: newName } : m,
        )
        await updatePreset.mutateAsync({
          draft: { mediaRegistry: updatedRegistry },
        })
        toast.success(`Renamed @${oldName} to @${newName}`)
      } catch (error) {
        toast.error('Failed to rename media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [draft.mediaRegistry, updatePreset],
  )

  // Handle removing media from registry
  const handleDeleteMedia = useCallback(
    async (name: string) => {
      try {
        const updatedRegistry = draft.mediaRegistry.filter(
          (m) => m.name !== name,
        )
        await updatePreset.mutateAsync({
          draft: { mediaRegistry: updatedRegistry },
        })
        toast.success(`Removed @${name} from media registry`)
      } catch (error) {
        toast.error('Failed to remove media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [draft.mediaRegistry, updatePreset],
  )

  const isDisabled = disabled || updatePreset.isPending

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel - Configuration */}
      <div className="flex w-[400px] flex-col gap-6 overflow-y-auto border-r p-6">
        {/* Model Settings Section */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Model Settings
          </h2>
          <ModelSettingsSection
            model={draft.model}
            aspectRatio={draft.aspectRatio}
            onModelChange={handleModelChange}
            onAspectRatioChange={handleAspectRatioChange}
            disabled={isDisabled}
          />
        </section>

        {/* Media Registry Section */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Media Registry
          </h2>
          <MediaRegistrySection
            mediaRegistry={draft.mediaRegistry}
            onAdd={handleAddMedia}
            onRename={handleRenameMedia}
            onDelete={handleDeleteMedia}
            disabled={isDisabled}
            workspaceId={workspaceId}
            userId={userId}
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
  )
}
