/**
 * ReferenceMediaStrip Component
 *
 * Horizontal strip displaying reference media thumbnails.
 * Shows both uploaded items and items currently uploading.
 * Reads all state from PromptComposerContext — zero props.
 */
import { ReferenceMediaItem, UploadingMediaItem } from './ReferenceMediaItem'
import { usePromptComposerContext } from './PromptComposerContext'

/**
 * ReferenceMediaStrip - Horizontal thumbnail strip for reference images
 */
export function ReferenceMediaStrip() {
  const { refMedia, disabled } = usePromptComposerContext()

  if (!refMedia) return null

  // Don't render if no items to show
  if (refMedia.items.length === 0 && refMedia.uploadingFiles.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-2">
      {/* Uploaded media items */}
      {refMedia.items.map((item) => (
        <ReferenceMediaItem
          key={item.mediaAssetId}
          media={item}
          onRemove={refMedia.onRemove}
          disabled={disabled}
        />
      ))}

      {/* Uploading items */}
      {refMedia.uploadingFiles.map((item) => (
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
