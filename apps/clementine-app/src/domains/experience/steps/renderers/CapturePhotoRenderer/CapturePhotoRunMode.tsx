/**
 * Capture Photo Run Mode
 *
 * Orchestrator for the camera capture flow in run mode.
 * Manages permission states, capture states, and upload flow.
 *
 * This step manages its own navigation - the ExperienceRuntime hides
 * standard navigation for capture.photo steps.
 *
 * Permission States:
 * - unknown: Loading spinner while checking permission
 * - undetermined: Prompt to request camera access
 * - granted: Full capture flow
 * - denied: Fallback to file upload with instructions
 * - unavailable: No camera hardware, fallback to file upload
 *
 * Capture States (after permission granted):
 * - idle/camera-active: Live camera feed with Take Photo button
 * - photo-preview: Captured photo with Retake/Continue buttons
 * - uploading: Progress indicator while saving
 * - error: Error message with retry option
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRuntime } from '../../../runtime/hooks/useRuntime'
import { uploadPhoto } from './lib/uploadPhoto'
import {
  CameraActive,
  CaptureError,
  PermissionDenied,
  PermissionLoading,
  PermissionPrompt,
  PermissionUnavailable,
  PhotoPreview,
  UploadProgress,
} from './components'
import type { StepRendererProps } from '../../registry/step-registry'
import type {
  AspectRatio,
  CameraCaptureError,
  CameraViewRef,
  CapturedPhoto,
} from '@/shared/camera'
import type { MediaReference } from '@clementine/shared'
import {
  useCameraPermission,
  useLibraryPicker,
  usePhotoCapture,
} from '@/shared/camera'

interface CapturePhotoRunModeProps {
  step: StepRendererProps['step']
  aspectRatio: AspectRatio
}

export function CapturePhotoRunMode({
  step,
  aspectRatio,
}: CapturePhotoRunModeProps) {
  // Runtime hook for session context, actions, and navigation
  const { sessionId, projectId, setStepResponse, next: nextStep } = useRuntime()

  // Camera refs and hooks
  const cameraRef = useRef<CameraViewRef>(null)
  const { status: permStatus, requestPermission } = useCameraPermission()
  const {
    status: captureStatus,
    photo,
    error,
    capture,
    retake,
    setStatus,
    setPhotoForPreview,
  } = usePhotoCapture({ cameraRef })

  // Uploading state (separate from capture status for better control)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Track if device has multiple cameras (for switch button)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Local aspect ratio state (user can switch during capture)
  const [activeAspectRatio, setActiveAspectRatio] =
    useState<AspectRatio>(aspectRatio)

  /**
   * Handle confirm: upload photo and update session
   */
  const handleConfirmAndUpload = useCallback(
    async (photoToUpload?: CapturedPhoto) => {
      const targetPhoto = photoToUpload || photo
      if (!targetPhoto) return

      setIsUploading(true)
      setUploadError(null)

      try {
        // Only upload if we have session context
        if (sessionId && projectId) {
          const { assetId, url, filePath } = await uploadPhoto({
            photo: targetPhoto,
            projectId,
            sessionId,
            stepId: step.id,
          })

          const mediaRef: MediaReference = {
            mediaAssetId: assetId,
            url,
            filePath,
            displayName: step.name,
          }

          // Write to unified responses array with MediaReference[] data
          setStepResponse(step, [mediaRef])
        }

        // Revoke preview URL after upload
        if (targetPhoto.previewUrl) {
          URL.revokeObjectURL(targetPhoto.previewUrl)
        }

        // Proceed to next step
        nextStep()
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Failed to save photo',
        )
        setIsUploading(false)
      }
    },
    [photo, sessionId, projectId, step, setStepResponse, nextStep],
  )

  // Library picker - goes to preview first so user can confirm
  const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
    onSelect: (selectedPhoto) => {
      // Clear any existing upload error before showing preview
      setUploadError(null)
      // Go to preview screen so user can confirm before upload
      setPhotoForPreview(selectedPhoto)
    },
    onError: (err) => {
      setUploadError(err.message)
    },
  })

  // Set status to camera-active when permission is granted
  useEffect(() => {
    if (permStatus === 'granted' && captureStatus === 'idle') {
      setStatus('camera-active')
    }
  }, [permStatus, captureStatus, setStatus])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (photo?.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    }
  }, [photo?.previewUrl])

  // Handle confirm button click
  const handleConfirm = useCallback(async () => {
    await handleConfirmAndUpload()
  }, [handleConfirmAndUpload])

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setUploadError(null)
    retake()
  }, [retake])

  // Handle camera ready
  const handleCameraReady = useCallback(() => {
    setStatus('camera-active')
    // Update hasMultipleCameras from camera ref
    setHasMultipleCameras(cameraRef.current?.hasMultipleCameras ?? false)
  }, [setStatus])

  // Handle switch camera
  const handleSwitchCamera = useCallback(async () => {
    await cameraRef.current?.switchCamera()
  }, [])

  // Handle camera error
  const handleCameraError = useCallback((err: CameraCaptureError) => {
    console.error('Camera error:', err)
  }, [])

  // Derive error message for error state
  const errorMessage =
    uploadError || error?.message || 'Failed to capture photo'

  // Uploading state - check first as it takes priority over all other states
  if (isUploading) {
    return <UploadProgress photo={photo} aspectRatio={activeAspectRatio} />
  }

  // Photo preview state - check before permission states so fallback picker works
  // (user can select photo even when permission is denied/unavailable)
  if (captureStatus === 'photo-preview' && photo) {
    return (
      <PhotoPreview
        photo={photo}
        aspectRatio={activeAspectRatio}
        onRetake={retake}
        onConfirm={handleConfirm}
      />
    )
  }

  // Permission: unknown (loading)
  if (permStatus === 'unknown') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <PermissionLoading />
      </div>
    )
  }

  // Permission: undetermined (prompt to allow)
  if (permStatus === 'undetermined') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <PermissionPrompt onRequestPermission={requestPermission} />
      </div>
    )
  }

  // Permission: denied (show instructions + fallback)
  if (permStatus === 'denied') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <PermissionDenied
          fileInputRef={fileInputRef}
          onOpenPicker={openPicker}
          onFileChange={handleFileChange}
        />
      </div>
    )
  }

  // Permission: unavailable (no hardware)
  if (permStatus === 'unavailable') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <PermissionUnavailable
          fileInputRef={fileInputRef}
          onOpenPicker={openPicker}
          onFileChange={handleFileChange}
        />
      </div>
    )
  }

  // Permission granted - show capture flow

  // Error state
  if (captureStatus === 'error' || uploadError) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <CaptureError
          errorMessage={errorMessage}
          fileInputRef={fileInputRef}
          onRetry={handleRetry}
          onOpenPicker={openPicker}
          onFileChange={handleFileChange}
        />
      </div>
    )
  }

  // Camera active state (default)
  return (
    <CameraActive
      cameraRef={cameraRef}
      aspectRatio={activeAspectRatio}
      fileInputRef={fileInputRef}
      hasMultipleCameras={hasMultipleCameras}
      onCameraReady={handleCameraReady}
      onCameraError={handleCameraError}
      onCapture={capture}
      onSwitchCamera={handleSwitchCamera}
      onOpenPicker={openPicker}
      onFileChange={handleFileChange}
      onAspectRatioChange={setActiveAspectRatio}
      showAspectRatioSwitcher={true}
    />
  )
}
