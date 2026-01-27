/**
 * AddMediaDialog Component
 *
 * Dialog for adding media to the preset's media registry.
 * Uses MediaPickerField for upload and TextField for reference name.
 */
import { useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { useUploadMediaAsset } from '@/domains/media-library'
import { MediaPickerField } from '@/shared/editor-controls'
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

/** Result of adding media to the registry */
export interface AddMediaResult {
  mediaAssetId: string
  url: string
  filePath: string
  name: string
}

interface AddMediaDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Callback when media is added */
  onAdd: (result: AddMediaResult) => void
  /** Existing reference names (for uniqueness validation) */
  existingNames: string[]
  /** Workspace ID for upload */
  workspaceId: string
  /** User ID for upload attribution */
  userId: string
}

/** Regex pattern for valid reference names */
const NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Dialog for adding media to the preset registry
 *
 * @example
 * ```tsx
 * <AddMediaDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onAdd={(result) => addToRegistry(result)}
 *   existingNames={['cat', 'style_ref']}
 *   workspaceId="ws-123"
 *   userId="user-456"
 * />
 * ```
 */
export function AddMediaDialog({
  open,
  onOpenChange,
  onAdd,
  existingNames,
  workspaceId,
  userId,
}: AddMediaDialogProps) {
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    mediaAssetId: string
    url: string
    filePath: string
  } | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined,
  )
  const [nameError, setNameError] = useState<string | null>(null)

  const uploadMedia = useUploadMediaAsset(workspaceId, userId)

  // Validate name
  const validateName = useCallback(
    (value: string): string | null => {
      if (!value) {
        return 'Reference name is required'
      }
      if (!NAME_PATTERN.test(value)) {
        return 'Name must start with a letter or underscore and contain only alphanumeric characters and underscores'
      }
      if (existingNames.includes(value)) {
        return 'This name is already used'
      }
      return null
    },
    [existingNames],
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

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      setUploadProgress(0)
      try {
        const result = await uploadMedia.mutateAsync({
          file,
          type: 'other',
          onProgress: setUploadProgress,
        })
        setUploadResult(result)
        setImageUrl(result.url)
      } catch {
        // Error is handled by mutation's onError
      } finally {
        setUploadProgress(undefined)
      }
    },
    [uploadMedia],
  )

  // Handle image removal
  const handleImageChange = useCallback((url: string | null) => {
    setImageUrl(url)
    if (!url) {
      setUploadResult(null)
    }
  }, [])

  // Handle add button click or form submit
  const handleAdd = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!uploadResult || !name || nameError) return

      onAdd({
        mediaAssetId: uploadResult.mediaAssetId,
        url: uploadResult.url,
        filePath: uploadResult.filePath,
        name,
      })

      // Reset state and close
      setName('')
      setImageUrl(null)
      setUploadResult(null)
      setNameError(null)
      onOpenChange(false)
    },
    [uploadResult, name, nameError, onAdd, onOpenChange],
  )

  // Handle cancel/close
  const handleClose = useCallback(() => {
    setName('')
    setImageUrl(null)
    setUploadResult(null)
    setNameError(null)
    onOpenChange(false)
  }, [onOpenChange])

  const isUploading = uploadMedia.isPending
  const canAdd = uploadResult && name && !nameError && !isUploading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleAdd}>
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
            <DialogDescription>
              Upload an image and give it a reference name to use in your prompt
              template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image upload */}
            <MediaPickerField
              label="Image"
              value={imageUrl}
              onChange={handleImageChange}
              onUpload={handleUpload}
              uploading={isUploading}
              uploadProgress={uploadProgress}
              removable
              objectFit="contain"
            />

            {/* Reference name input */}
            <div className="space-y-2">
              <Label htmlFor="media-name">Reference Name</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="media-name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="style_ref"
                  disabled={isUploading}
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
            <Button type="submit" disabled={!canAdd}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
