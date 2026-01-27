import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateOverlays, useUploadAndUpdateOverlays } from '../hooks'
import { OverlayFrame } from '.'
import type { OverlayReference } from '@/domains/project-config/shared'

interface OverlaySectionProps {
  /**
   * Project ID
   */
  projectId: string

  /**
   * Workspace ID
   */
  workspaceId: string

  /**
   * Current user ID
   */
  userId: string

  /**
   * Current overlay references
   */
  overlays: {
    '1:1': OverlayReference | null
    '9:16': OverlayReference | null
  } | null
}

type AspectRatio = '1:1' | '9:16'

interface UploadState {
  aspectRatio: AspectRatio | null
  progress: number
  fileName: string
}

export function OverlaySection({
  projectId,
  workspaceId,
  userId,
  overlays,
}: OverlaySectionProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    aspectRatio: null,
    progress: 0,
    fileName: '',
  })

  // Composition hook: Upload + update as single tracked operation
  const uploadAndUpdate = useUploadAndUpdateOverlays(
    projectId,
    workspaceId,
    userId,
  )

  // For remove operation (config update only, no upload)
  const updateOverlays = useUpdateOverlays(projectId)

  // Handle upload for a specific aspect ratio
  const handleUpload = async (file: File, aspectRatio: AspectRatio) => {
    try {
      // Set uploading state
      setUploadState({
        aspectRatio,
        progress: 0,
        fileName: file.name,
      })

      // Single operation: Upload to Storage + update project config
      // This is tracked as ONE save operation by useTrackedMutation
      await uploadAndUpdate.mutateAsync({
        file,
        aspectRatio,
        onProgress: (progress) => {
          setUploadState((prev) => ({ ...prev, progress }))
        },
      })

      // Success
      toast.success('Overlay uploaded successfully')
    } catch (error) {
      // Error
      const message = error instanceof Error ? error.message : 'Upload failed'
      toast.error(message)
    } finally {
      // Reset uploading state
      setUploadState({
        aspectRatio: null,
        progress: 0,
        fileName: '',
      })
    }
  }

  // Handle remove for a specific aspect ratio
  const handleRemove = async (aspectRatio: AspectRatio) => {
    try {
      // Update project config to null
      await updateOverlays.mutateAsync({
        [aspectRatio]: null,
      })

      // Success
      toast.success('Overlay removed successfully')
    } catch (error) {
      // Error
      const message = error instanceof Error ? error.message : 'Remove failed'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold">Overlay Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload overlay images for different aspect ratios. These will be
          applied to guest photos. Supported formats: PNG, JPG, WebP. Max file
          size: 5MB.
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        {/* 1:1 Square Overlay */}
        <OverlayFrame
          label="1:1 Square"
          ratio="1:1"
          overlayRef={overlays?.['1:1'] || null}
          onUpload={(file) => handleUpload(file, '1:1')}
          onRemove={() => handleRemove('1:1')}
          isUploading={uploadState.aspectRatio === '1:1'}
          uploadProgress={uploadState.progress}
          uploadingFileName={uploadState.fileName}
        />

        {/* 9:16 Portrait Overlay */}
        <OverlayFrame
          label="9:16 Portrait"
          ratio="9:16"
          overlayRef={overlays?.['9:16'] || null}
          onUpload={(file) => handleUpload(file, '9:16')}
          onRemove={() => handleRemove('9:16')}
          isUploading={uploadState.aspectRatio === '9:16'}
          uploadProgress={uploadState.progress}
          uploadingFileName={uploadState.fileName}
        />
      </div>
    </div>
  )
}
