/**
 * MediaRegistryItem Component
 *
 * Displays a single media entry from the preset's media registry.
 * Shows thumbnail with name and delete button on hover.
 */
import { Trash2 } from 'lucide-react'

import type { PresetMediaEntry } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui-kit/ui/tooltip'
import { cn } from '@/shared/utils'

interface MediaRegistryItemProps {
  /** Media entry to display */
  media: PresetMediaEntry
  /** Callback when delete is clicked */
  onDelete: () => void
  /** Whether the item is disabled (e.g., during delete operation) */
  disabled?: boolean
}

/**
 * Media registry item with thumbnail, name, and delete action
 *
 * @example
 * ```tsx
 * <MediaRegistryItem
 *   media={{ mediaAssetId: '123', url: 'https://...', filePath: '...', name: 'style_ref' }}
 *   onDelete={() => handleDelete('style_ref')}
 *   disabled={isDeleting}
 * />
 * ```
 */
export function MediaRegistryItem({
  media,
  onDelete,
  disabled = false,
}: MediaRegistryItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group relative">
          {/* Thumbnail container */}
          <div
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg border bg-muted',
              disabled && 'opacity-50',
            )}
          >
            <img
              src={media.url}
              alt={media.name}
              className="h-full w-full object-cover"
            />

            {/* Delete button overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onDelete}
                disabled={disabled}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete {media.name}</span>
              </Button>
            </div>
          </div>

          {/* Name label */}
          <p className="mt-1 truncate text-xs text-muted-foreground">
            @{media.name}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>@{media.name}</p>
      </TooltipContent>
    </Tooltip>
  )
}
