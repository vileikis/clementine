/**
 * ReferenceMediaItem Component
 *
 * Single thumbnail with remove button for reference media.
 * Shows upload progress spinner when uploading.
 */
import { Loader2, X } from 'lucide-react'

import type { MediaReference } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui-kit/ui/tooltip'

export interface ReferenceMediaItemProps {
  /** Media reference to display */
  media: MediaReference
  /** Callback when remove button is clicked */
  onRemove: (mediaAssetId: string) => void
  /** Whether the item is disabled */
  disabled?: boolean
}

export interface UploadingMediaItemProps {
  /** Temporary ID for tracking */
  tempId: string
  /** Upload progress (0-100) */
  progress: number
  /** File name being uploaded */
  fileName: string
}

/**
 * ReferenceMediaItem - Thumbnail with remove control for reference images
 */
export function ReferenceMediaItem({
  media,
  onRemove,
  disabled,
}: ReferenceMediaItemProps) {
  const handleRemove = () => {
    onRemove(media.mediaAssetId)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group relative size-16 shrink-0 bg-muted">
          <img
            src={media.url}
            alt={media.displayName}
            className="size-full overflow-hidden rounded-md object-cover"
          />
          {!disabled && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -right-1 -top-1 size-5 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleRemove}
              aria-label={`Remove ${media.displayName}`}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{media.displayName}</TooltipContent>
    </Tooltip>
  )
}

/**
 * UploadingMediaItem - Shows upload progress for pending uploads
 */
export function UploadingMediaItem({
  progress,
  fileName,
}: UploadingMediaItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <div
            className="absolute inset-x-0 bottom-0 h-1 bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
          <span className="sr-only">
            Uploading {fileName}: {progress}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">Uploading: {fileName}</TooltipContent>
    </Tooltip>
  )
}
