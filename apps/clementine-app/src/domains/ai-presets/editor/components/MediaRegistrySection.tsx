/**
 * MediaRegistrySection Component
 *
 * Section for managing the preset's media registry.
 * Shows a grid of registered media with add/edit/remove functionality.
 */
import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'

import { AddMediaDialog } from './AddMediaDialog'
import { EditMediaDialog } from './EditMediaDialog'
import { MediaRegistryItem } from './MediaRegistryItem'
import type { AddMediaResult } from './AddMediaDialog'
import type { PresetMediaEntry } from '@clementine/shared'
import { cn } from '@/shared/utils'

interface MediaRegistrySectionProps {
  /** Array of registered media entries */
  mediaRegistry: PresetMediaEntry[]
  /** Callback when media is added */
  onAdd: (media: AddMediaResult) => void
  /** Callback when media name is changed */
  onRename: (oldName: string, newName: string) => void
  /** Callback when media is deleted */
  onDelete: (name: string) => void
  /** Whether the section is disabled */
  disabled?: boolean
  /** Workspace ID for upload */
  workspaceId: string
  /** User ID for upload attribution */
  userId: string
}

/**
 * Media registry section with grid display and add/edit/delete functionality
 *
 * @example
 * ```tsx
 * <MediaRegistrySection
 *   mediaRegistry={preset.mediaRegistry}
 *   onAdd={(media) => addToRegistry(media)}
 *   onRename={(oldName, newName) => renameInRegistry(oldName, newName)}
 *   onDelete={(name) => removeFromRegistry(name)}
 *   disabled={isUpdating}
 *   workspaceId="ws-123"
 *   userId="user-456"
 * />
 * ```
 */
export function MediaRegistrySection({
  mediaRegistry,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
  workspaceId,
  userId,
}: MediaRegistrySectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<PresetMediaEntry | null>(
    null,
  )

  // Get existing names for uniqueness validation
  const existingNames = mediaRegistry.map((m) => m.name)

  // Handle add from dialog
  const handleAdd = useCallback(
    (result: AddMediaResult) => {
      onAdd(result)
    },
    [onAdd],
  )

  // Handle rename from edit dialog
  const handleRename = useCallback(
    (oldName: string, newName: string) => {
      onRename(oldName, newName)
    },
    [onRename],
  )

  return (
    <div>
      {/* Media grid with add button as first item */}
      <div className="grid grid-cols-4 gap-3">
        {/* Add Media button as first grid item */}
        <button
          type="button"
          onClick={() => setAddDialogOpen(true)}
          disabled={disabled}
          className={cn(
            'flex aspect-square items-center justify-center rounded-lg border-2 border-dashed transition-colors',
            disabled
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
            onDelete={() => onDelete(media.name)}
            disabled={disabled}
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
