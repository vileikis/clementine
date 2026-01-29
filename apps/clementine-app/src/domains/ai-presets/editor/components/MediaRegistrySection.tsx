/**
 * MediaRegistrySection Component
 *
 * Self-contained section for managing the preset's media registry.
 * Owns its own update logic using useUpdateMediaRegistry hook.
 * Shows a grid of registered media with add/edit/remove functionality.
 */
import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useUpdateMediaRegistry } from '../hooks/useUpdateMediaRegistry'
import { AddMediaDialog } from './AddMediaDialog'
import { EditMediaDialog } from './EditMediaDialog'
import { MediaRegistryItem } from './MediaRegistryItem'
import type { AddMediaResult } from './AddMediaDialog'
import type { PresetMediaEntry } from '@clementine/shared'
import { cn } from '@/shared/utils'

interface MediaRegistrySectionProps {
  /** Array of registered media entries */
  mediaRegistry: PresetMediaEntry[]
  /** Workspace ID for updates */
  workspaceId: string
  /** Preset ID for updates */
  presetId: string
  /** User ID for upload attribution */
  userId: string
  /** Whether the section is disabled (e.g., during publish) */
  disabled?: boolean
}

/**
 * Media registry section with grid display and add/edit/delete functionality
 *
 * Self-contained component that handles its own updates via useUpdateMediaRegistry.
 *
 * @example
 * ```tsx
 * <MediaRegistrySection
 *   mediaRegistry={preset.draft.mediaRegistry}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   userId={user.uid}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function MediaRegistrySection({
  mediaRegistry,
  workspaceId,
  presetId,
  userId,
  disabled = false,
}: MediaRegistrySectionProps) {
  const updateMediaRegistry = useUpdateMediaRegistry(workspaceId, presetId)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<PresetMediaEntry | null>(
    null,
  )

  // Get existing names for uniqueness validation
  const existingNames = mediaRegistry.map((m) => m.name)

  // Handle add from dialog
  const handleAdd = useCallback(
    async (result: AddMediaResult) => {
      try {
        const newEntry: PresetMediaEntry = {
          mediaAssetId: result.mediaAssetId,
          url: result.url,
          filePath: result.filePath,
          displayName: 'Untitled',
          name: result.name,
        }
        const updatedRegistry = [...mediaRegistry, newEntry]
        await updateMediaRegistry.mutateAsync(updatedRegistry)
        toast.success(`Added @${result.name} to media registry`)
      } catch (error) {
        toast.error('Failed to add media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [mediaRegistry, updateMediaRegistry],
  )

  // Handle rename from edit dialog
  const handleRename = useCallback(
    async (oldName: string, newName: string) => {
      try {
        const updatedRegistry = mediaRegistry.map((m) =>
          m.name === oldName ? { ...m, name: newName } : m,
        )
        await updateMediaRegistry.mutateAsync(updatedRegistry)
        toast.success(`Renamed @${oldName} to @${newName}`)
      } catch (error) {
        toast.error('Failed to rename media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [mediaRegistry, updateMediaRegistry],
  )

  // Handle delete
  const handleDelete = useCallback(
    async (name: string) => {
      try {
        const updatedRegistry = mediaRegistry.filter((m) => m.name !== name)
        await updateMediaRegistry.mutateAsync(updatedRegistry)
        toast.success(`Removed @${name} from media registry`)
      } catch (error) {
        toast.error('Failed to remove media', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [mediaRegistry, updateMediaRegistry],
  )

  const isDisabled = disabled || updateMediaRegistry.isPending

  return (
    <div>
      {/* Media grid with add button as first item */}
      <div className="grid grid-cols-4 gap-3">
        {/* Add Media button as first grid item */}
        <button
          type="button"
          onClick={() => setAddDialogOpen(true)}
          disabled={isDisabled}
          className={cn(
            'flex aspect-square items-center justify-center rounded-lg border-2 border-dashed transition-colors',
            isDisabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:border-primary hover:bg-muted/50',
          )}
        >
          <Plus className="h-6 w-6 text-muted-foreground" />
          <span className="sr-only">Add Media</span>
        </button>

        {/* Media items */}
        {mediaRegistry.map((media) => (
          <MediaRegistryItem
            key={media.name}
            media={media}
            onEdit={() => setEditingMedia(media)}
            onDelete={() => handleDelete(media.name)}
            disabled={isDisabled}
          />
        ))}
      </div>

      {/* Add Media dialog */}
      <AddMediaDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
        existingNames={existingNames}
        workspaceId={workspaceId}
        userId={userId}
      />

      {/* Edit Media dialog */}
      <EditMediaDialog
        media={editingMedia}
        onClose={() => setEditingMedia(null)}
        onSave={handleRename}
        existingNames={existingNames}
      />
    </div>
  )
}
