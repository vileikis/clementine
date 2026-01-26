/**
 * AIPresetItem Component
 *
 * Individual AI preset card with context menu for CRUD operations.
 * Displays preset metadata and provides actions for admin users.
 */
'use client'

import { useNavigate, useParams } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'
import type { AIPreset } from '@clementine/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu'
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

  /** Render function for dropdown menu items (allows parent to control actions) */
  renderMenuItems?: () => React.ReactNode
}

/**
 * AIPresetItem component
 *
 * Displays a single AI preset in the list with metadata and context menu.
 *
 * Features:
 * - Card display with name, description, model, aspect ratio
 * - Variable and media counts
 * - Last updated timestamp
 * - Clickable for navigation to editor
 * - Context menu with admin actions
 *
 * @example
 * ```tsx
 * <AIPresetItem
 *   preset={preset}
 *   renderMenuItems={() => (
 *     <>
 *       <DropdownMenuItem>Rename</DropdownMenuItem>
 *       <DropdownMenuItem>Duplicate</DropdownMenuItem>
 *       <DropdownMenuItem>Delete</DropdownMenuItem>
 *     </>
 *   )}
 * />
 * ```
 */
export function AIPresetItem({ preset, renderMenuItems }: AIPresetItemProps) {
  const navigate = useNavigate()
  const { workspaceSlug } = useParams({ strict: false })

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

  return (
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
      {renderMenuItems && (
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label={`Actions for ${preset.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {renderMenuItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
