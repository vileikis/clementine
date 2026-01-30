/**
 * Prompt Media Picker Component
 *
 * Media picker for prompt reference images.
 * Uses MediaPickerField for drag-and-drop upload functionality.
 */
import { Info } from 'lucide-react'
import { useParams } from '@tanstack/react-router'
import type { MediaReference } from '@clementine/shared'

import { Label } from '@/ui-kit/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-kit/ui/tooltip'
import { MediaPickerField } from '@/shared/editor-controls'
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
  const { workspaceSlug } = useParams({ strict: false })
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  const { upload, isUploading, uploadProgress } = useUploadPromptMedia(
    workspace?.id,
    user?.uid,
  )

  const handleUpload = async (file: File) => {
    const mediaRef = await upload(file)
    if (mediaRef) {
      onChange(mediaRef)
    }
  }

  const handleRemove = () => {
    onChange(undefined)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label>Prompt Media</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>
                This image will be used as context when the user selects this
                option.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <MediaPickerField
        value={value?.url ?? null}
        onChange={handleRemove}
        onUpload={handleUpload}
        uploading={isUploading}
        uploadProgress={uploadProgress}
        disabled={disabled}
        className="aspect-square w-32"
        objectFit="cover"
      />
    </div>
  )
}
