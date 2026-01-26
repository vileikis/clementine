/**
 * AIPresetItem Component
 *
 * Self-contained AI preset card with context menu for CRUD operations.
 * Displays preset metadata and manages its own dialog state.
 */
'use client'

import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDuplicateAIPreset } from '../hooks/useDuplicateAIPreset'
import { RenameAIPresetDialog } from './RenameAIPresetDialog'
import { DeleteAIPresetDialog } from './DeleteAIPresetDialog'
import type { AIPreset } from '@clementine/shared'
import type { MenuSection } from '@/shared/components'
import { ContextDropdownMenu } from '@/shared/components'
import { Button } from '@/ui-kit/ui/button'

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  return 'just now'
}

export interface AIPresetItemProps {
  /** AI preset to display */
  preset: AIPreset

  /** Workspace ID for mutations */
  workspaceId: string
}

/**
 * AIPresetItem component
 *
 * Self-contained preset card that manages its own:
 * - Navigation to editor on click
 * - Context menu actions (rename, duplicate, delete)
 * - Dialog state for rename and delete confirmations
 *
 * @example
 * ```tsx
 * <AIPresetItem preset={preset} workspaceId={workspaceId} />
 * ```
 */
export function AIPresetItem({ preset, workspaceId }: AIPresetItemProps) {
  const navigate = useNavigate()
  const { workspaceSlug } = useParams({ strict: false })

  // Dialog state
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Mutations
  const duplicatePreset = useDuplicateAIPreset(workspaceId)

  const variableCount = preset.variables?.length ?? 0
  const mediaCount = preset.mediaRegistry?.length ?? 0

  const handlePresetClick = () => {
    navigate({
      to: '/workspace/$workspaceSlug/ai-presets/$presetId',
      params: {
        workspaceSlug: workspaceSlug as string,
        presetId: preset.id,
      },
    })
  }

  const handleDuplicate = async () => {
    try {
      await duplicatePreset.mutateAsync({ presetId: preset.id })
      toast.success('Preset duplicated', {
        description: `Created "Copy of ${preset.name}"`,
      })
    } catch (error) {
      toast.error('Failed to duplicate preset', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  const menuSections: MenuSection[] = [
    {
      items: [
        {
          key: 'rename',
          label: 'Rename',
          icon: Pencil,
          onClick: () => setShowRenameDialog(true),
        },
        {
          key: 'duplicate',
          label: 'Duplicate',
          icon: Copy,
          onClick: handleDuplicate,
          disabled: duplicatePreset.isPending,
        },
      ],
    },
    {
      items: [
        {
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          onClick: () => setShowDeleteDialog(true),
          destructive: true,
        },
      ],
    },
  ]

  return (
    <>
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-4 min-h-[44px]"
        role="listitem"
        onClick={handlePresetClick}
      >
        {/* Preset info */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h4 className="font-medium truncate">{preset.name}</h4>
          {preset.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {preset.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="bg-muted px-2 py-0.5 rounded">{preset.model}</span>
            <span className="bg-muted px-2 py-0.5 rounded">
              {preset.aspectRatio}
            </span>
            <span>
              {variableCount} variable{variableCount !== 1 ? 's' : ''}
            </span>
            <span>{mediaCount} media</span>
            <span>Updated {formatRelativeTime(preset.updatedAt)}</span>
          </div>
        </div>

        {/* Context menu */}
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <ContextDropdownMenu
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            sections={menuSections}
            aria-label={`Actions for ${preset.name}`}
          />
        </div>
      </div>

      {/* Rename dialog */}
      <RenameAIPresetDialog
        presetId={preset.id}
        workspaceId={workspaceId}
        initialName={preset.name}
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
      />

      {/* Delete dialog */}
      <DeleteAIPresetDialog
        presetId={preset.id}
        workspaceId={workspaceId}
        presetName={preset.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  )
}
