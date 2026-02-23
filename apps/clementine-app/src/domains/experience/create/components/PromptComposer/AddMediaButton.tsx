/**
 * AddMediaButton Component
 *
 * Plus button with hidden native file input for selecting multiple images.
 * Accepts image files only via the accept attribute.
 * Reads state from PromptComposerContext — zero props.
 */
import { useRef } from 'react'
import { Plus } from 'lucide-react'

import { usePromptComposerContext } from './PromptComposerContext'
import { Button } from '@/ui-kit/ui/button'

/**
 * AddMediaButton - Plus button that opens file picker for multiple images
 */
export function AddMediaButton() {
  const { modality, refMedia, disabled } = usePromptComposerContext()
  const inputRef = useRef<HTMLInputElement>(null)

  if (!modality.supports.referenceMedia) return null

  const isDisabled = disabled || !refMedia?.canAddMore || refMedia?.isUploading

  const handleClick = () => {
    if (isDisabled) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled || !refMedia) return
    const files = e.target.files
    if (files && files.length > 0) {
      refMedia.onFilesSelected(Array.from(files))
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Add reference images"
        className="size-11 shrink-0 cursor-pointer"
      >
        <Plus className="size-4" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  )
}
