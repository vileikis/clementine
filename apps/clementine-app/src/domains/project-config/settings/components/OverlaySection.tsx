import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateOverlays, useUploadAndUpdateOverlays } from '../hooks'
import { OverlayFrame } from '.'
import type { OverlayReference } from '@/domains/project-config/shared'
import type { OverlayKey } from '@clementine/shared'

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
   * Current overlay references for all aspect ratios
   */
  overlays: {
    '1:1': OverlayReference | null
    '3:2': OverlayReference | null
    '2:3': OverlayReference | null
    '9:16': OverlayReference | null
    default: OverlayReference | null
  } | null
}

/**
 * Overlay slot configuration for rendering
 */
const OVERLAY_SLOTS: {
  key: OverlayKey
  label: string
  ratio: string
  isDefault?: boolean
}[] = [
  { key: '1:1', label: '1:1 Square', ratio: '1:1' },
  { key: '3:2', label: '3:2 Landscape', ratio: '3:2' },
  { key: '2:3', label: '2:3 Portrait', ratio: '2:3' },
  { key: '9:16', label: '9:16 Vertical', ratio: '9:16' },
  {
    key: 'default',
    label: 'Default Fallback',
    ratio: 'default',
    isDefault: true,
  },
]

interface UploadState {
  aspectRatio: OverlayKey | null
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
  const handleUpload = async (file: File, aspectRatio: OverlayKey) => {
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
  const handleRemove = async (aspectRatio: OverlayKey) => {
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
          applied to guest photos. The default overlay is used when no exact
          match is found. Supported formats: PNG, JPG, WebP. Max file size: 5MB.
        </p>
      </div>

      {/* Responsive grid: 2 cols on mobile, 3+ on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {OVERLAY_SLOTS.map((slot) => (
          <OverlayFrame
            key={slot.key}
            label={slot.label}
            ratio={slot.ratio}
            overlayRef={overlays?.[slot.key] || null}
            onUpload={(file) => handleUpload(file, slot.key)}
            onRemove={() => handleRemove(slot.key)}
            isUploading={uploadState.aspectRatio === slot.key}
            uploadProgress={uploadState.progress}
            uploadingFileName={uploadState.fileName}
            isDefault={slot.isDefault}
          />
        ))}
      </div>
    </div>
  )
}
