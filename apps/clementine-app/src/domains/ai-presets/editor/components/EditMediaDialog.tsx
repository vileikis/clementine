/**
 * EditMediaDialog Component
 *
 * Dialog for editing a media entry's reference name in the preset's media registry.
 */
import { useCallback, useEffect, useState } from 'react'

import type { PresetMediaEntry } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

interface EditMediaDialogProps {
  /** The media entry being edited (null when dialog is closed) */
  media: PresetMediaEntry | null
  /** Callback to close the dialog */
  onClose: () => void
  /** Callback when media name is updated */
  onSave: (oldName: string, newName: string) => void
  /** Existing reference names (for uniqueness validation, excluding current) */
  existingNames: string[]
}

/** Regex pattern for valid reference names */
const NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Dialog for editing a media entry's reference name
 *
 * @example
 * ```tsx
 * <EditMediaDialog
 *   media={selectedMedia}
 *   onClose={() => setSelectedMedia(null)}
 *   onSave={(oldName, newName) => updateMediaName(oldName, newName)}
 *   existingNames={['cat', 'style_ref']}
 * />
 * ```
 */
export function EditMediaDialog({
  media,
  onClose,
  onSave,
  existingNames,
}: EditMediaDialogProps) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  // Reset name when media changes
  useEffect(() => {
    if (media) {
      setName(media.name)
      setNameError(null)
    }
  }, [media])

  // Validate name (excluding current name from uniqueness check)
  const validateName = useCallback(
    (value: string): string | null => {
      if (!value) {
        return 'Reference name is required'
      }
      if (!NAME_PATTERN.test(value)) {
        return 'Name must start with a letter or underscore and contain only alphanumeric characters and underscores'
      }
      // Only check uniqueness if the name actually changed
      if (media && value !== media.name && existingNames.includes(value)) {
        return 'This name is already used'
      }
      return null
    },
    [existingNames, media],
  )

  // Handle name change with validation
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setName(value)
      setNameError(validateName(value))
    },
    [validateName],
  )

  // Handle save button click or form submit
  const handleSave = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!media || !name || nameError) return

      // Only save if name actually changed
      if (name !== media.name) {
        onSave(media.name, name)
      }
      onClose()
    },
    [media, name, nameError, onSave, onClose],
  )

  // Handle cancel/close
  const handleClose = useCallback(() => {
    setName('')
    setNameError(null)
    onClose()
  }, [onClose])

  const isOpen = media !== null
  const hasChanges = media && name !== media.name
  const canSave = name && !nameError

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update the reference name for this media.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image preview */}
            {media && (
              <div className="flex justify-center">
                <div className="aspect-video w-full max-w-[200px] overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={media.url}
                    alt={media.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Reference name input */}
            <div className="space-y-2">
              <Label htmlFor="edit-media-name">Reference Name</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="edit-media-name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="style_ref"
                  className={nameError ? 'border-destructive' : ''}
                />
              </div>
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use this name to reference the image in your prompt: @
                {name || 'name'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || !hasChanges}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
