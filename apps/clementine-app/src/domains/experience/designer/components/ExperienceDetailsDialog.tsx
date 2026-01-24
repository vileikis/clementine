/**
 * ExperienceDetailsDialog Component
 *
 * Dialog for editing experience details (name + cover image).
 *
 * - Media uploads go to Storage immediately (for preview)
 * - Firestore update only happens on Save button click
 * - Cancel discards pending changes (uploaded media may remain orphaned)
 */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useUploadExperienceCover } from '../hooks/useUploadExperienceCover'
import type { Experience, ExperienceMedia } from '@/domains/experience/shared'
import { useUpdateExperience } from '@/domains/experience/shared'
import { MediaPickerField } from '@/shared/editor-controls'
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

interface ExperienceDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experience: Experience
  workspaceId: string
  userId: string
}

export function ExperienceDetailsDialog({
  open,
  onOpenChange,
  experience,
  workspaceId,
  userId,
}: ExperienceDetailsDialogProps) {
  // Local form state (reset when dialog opens)
  const [name, setName] = useState(experience.name)
  const [media, setMedia] = useState<ExperienceMedia | null>(experience.media)
  const [nameError, setNameError] = useState<string | null>(null)

  // Upload hook (for preview only)
  const { upload, isUploading, uploadProgress } = useUploadExperienceCover(
    workspaceId,
    userId,
  )

  // Update mutation (for Save)
  const updateExperience = useUpdateExperience()

  // Reset form state when dialog opens
  useEffect(() => {
    if (open) {
      setName(experience.name)
      setMedia(experience.media)
      setNameError(null)
    }
  }, [open, experience.name, experience.media])

  // Handle media upload (preview only)
  const handleUpload = async (file: File) => {
    const result = await upload(file)
    if (result) {
      setMedia({ mediaAssetId: result.mediaAssetId, url: result.url })
    }
  }

  // Handle media remove
  const handleRemoveMedia = () => {
    setMedia(null)
  }

  // Validate form
  const validateForm = (): boolean => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Name is required')
      return false
    }
    if (trimmedName.length > 100) {
      setNameError('Name must be 100 characters or less')
      return false
    }
    setNameError(null)
    return true
  }

  // Handle Save
  const handleSave = async () => {
    if (!validateForm()) return

    try {
      await updateExperience.mutateAsync({
        workspaceId,
        experienceId: experience.id,
        name: name.trim(),
        media,
      })

      toast.success('Experience updated')
      onOpenChange(false)
    } catch {
      toast.error('Failed to save changes')
    }
  }

  // Check if there are unsaved changes
  const hasChanges =
    name.trim() !== experience.name ||
    media?.mediaAssetId !== experience.media?.mediaAssetId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Experience Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="experience-name">Name</Label>
            <Input
              id="experience-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              placeholder="Experience name"
              maxLength={100}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <MediaPickerField
              value={media?.url ?? null}
              onChange={(value) => {
                if (value === null) handleRemoveMedia()
              }}
              onUpload={handleUpload}
              accept="image/png,image/jpeg,image/webp"
              removable
              uploading={isUploading}
              uploadProgress={uploadProgress}
              className="aspect-square w-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isUploading || updateExperience.isPending}
          >
            {updateExperience.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
