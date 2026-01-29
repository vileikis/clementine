/**
 * Prompt Media Picker Component
 *
 * File upload button with thumbnail preview for prompt media.
 * Features: upload button, thumbnail display, remove button.
 */
import { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useParams } from '@tanstack/react-router'
import type { MediaReference } from '@clementine/shared'

import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { useUploadPromptMedia } from '@/domains/experience/designer/hooks/useUploadPromptMedia'
import { useWorkspace } from '@/domains/workspace'
import { useAuth } from '@/domains/auth'

interface PromptMediaPickerProps {
  value: MediaReference | undefined
  onChange: (value: MediaReference | undefined) => void
  disabled?: boolean
}

export function PromptMediaPicker({
  value,
  onChange,
  disabled = false,
}: PromptMediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { workspaceSlug } = useParams({ strict: false })
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  const { upload, isUploading, uploadProgress } = useUploadPromptMedia(
    workspace?.id,
    user?.uid,
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    const mediaRef = await upload(file)
    if (mediaRef) {
      onChange(mediaRef)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange(undefined)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label>Prompt Media (optional)</Label>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value.url}
            alt={(value.fileName as string) || 'Prompt media'}
            className="h-32 w-32 rounded-md border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Image'}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        This image will be used as context when the user selects this option.
      </p>
    </div>
  )
}
