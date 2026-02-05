/**
 * AddMediaButton Component
 *
 * Plus button with hidden native file input for selecting multiple images.
 * Accepts image files only via the accept attribute.
 */
import { useRef } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/ui-kit/ui/button'

export interface AddMediaButtonProps {
  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void
  /** Whether the button is disabled (e.g., max limit reached) */
  disabled?: boolean
}

/**
 * AddMediaButton - Plus button that opens file picker for multiple images
 */
export function AddMediaButton({
  onFilesSelected,
  disabled,
}: AddMediaButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const files = e.target.files
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files))
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
        disabled={disabled}
        aria-label="Add reference images"
        className="size-11 shrink-0"
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
