/**
 * ReferenceMediaStrip Component
 *
 * Horizontal strip displaying reference media thumbnails.
 * Shows both uploaded items and items currently uploading.
 */
import { ReferenceMediaItem, UploadingMediaItem } from './ReferenceMediaItem'
import type { UploadingFile } from '../../hooks'
import type { MediaReference } from '@clementine/shared'

export interface ReferenceMediaStripProps {
  /** Uploaded media references */
  media: MediaReference[]
  /** Files currently being uploaded */
  uploadingFiles: UploadingFile[]
  /** Callback when remove button is clicked */
  onRemove: (mediaAssetId: string) => void
  /** Whether the strip is disabled */
  disabled?: boolean
}

/**
 * ReferenceMediaStrip - Horizontal thumbnail strip for reference images
 */
export function ReferenceMediaStrip({
  media,
  uploadingFiles,
  onRemove,
  disabled,
}: ReferenceMediaStripProps) {
  // Don't render if no items to show
  if (media.length === 0 && uploadingFiles.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-2">
      {/* Uploaded media items */}
      {media.map((item) => (
        <ReferenceMediaItem
          key={item.mediaAssetId}
          media={item}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}

      {/* Uploading items */}
      {uploadingFiles.map((item) => (
        <UploadingMediaItem
          key={item.tempId}
          tempId={item.tempId}
          progress={item.progress}
          fileName={item.file.name}
        />
      ))}
    </div>
  )
}
