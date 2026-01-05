import { useState } from 'react'
import { toast } from 'sonner'
import { OverlayFrame } from '../components/OverlayFrame'
import { useUpdateOverlays } from '../hooks'
import type { OverlayReference } from '@/domains/event/shared/schemas/project-event-config.schema'
import { useUploadMediaAsset } from '@/domains/media-library'

interface OverlaySectionProps {
  /**
   * Project ID
   */
  projectId: string

  /**
   * Event ID
   */
  eventId: string

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
  eventId,
  workspaceId,
  userId,
  overlays,
}: OverlaySectionProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    aspectRatio: null,
    progress: 0,
    fileName: '',
  })

  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateOverlays = useUpdateOverlays(projectId, eventId)

  // Handle upload for a specific aspect ratio
  const handleUpload = async (file: File, aspectRatio: AspectRatio) => {
    try {
      // Set uploading state
      setUploadState({
        aspectRatio,
        progress: 0,
        fileName: file.name,
      })

      // Upload to Storage + create MediaAsset
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({
        file,
        type: 'overlay',
        onProgress: (progress) => {
          setUploadState((prev) => ({ ...prev, progress }))
        },
      })

      // Update event config
      await updateOverlays.mutateAsync({
        [aspectRatio]: { mediaAssetId, url },
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
      // Update event config to null
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
        <h3 className="text-lg font-semibold">Overlay Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload overlay images for different aspect ratios. These will be
          applied to guest photos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 1:1 Square Overlay */}
        <OverlayFrame
          label="1:1 Square"
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
