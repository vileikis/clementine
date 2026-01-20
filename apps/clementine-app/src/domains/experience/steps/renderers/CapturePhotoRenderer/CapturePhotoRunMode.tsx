/**
 * Capture Photo Run Mode
 *
 * Orchestrator for the camera capture flow in run mode.
 * Manages permission states, capture states, and upload flow.
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
import { useExperienceRuntimeStore } from '../../../runtime/stores/experienceRuntimeStore'
import { StepLayout } from '../StepLayout'
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
  CameraCaptureError,
  CameraViewRef,
  CapturedPhoto,
} from '@/shared/camera'
import type { AspectRatio } from '../../schemas/capture-photo.schema'
import {
  useCameraPermission,
  useLibraryPicker,
  usePhotoCapture,
} from '@/shared/camera'

interface CapturePhotoRunModeProps {
  step: StepRendererProps['step']
  aspectRatio: AspectRatio
  onSubmit?: () => void
  onBack?: () => void
  canGoBack?: boolean
}

export function CapturePhotoRunMode({
  step,
  aspectRatio,
  onSubmit,
  onBack,
  canGoBack,
}: CapturePhotoRunModeProps) {
  // Runtime store for session context
  const { sessionId, projectId, setCapturedMedia } = useExperienceRuntimeStore()

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
  } = usePhotoCapture({ cameraRef })

  // Uploading state (separate from capture status for better control)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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
          const { assetId, url } = await uploadPhoto({
            photo: targetPhoto,
            projectId,
            sessionId,
            stepId: step.id,
          })

          // Update runtime store with captured media
          setCapturedMedia(step.id, {
            assetId,
            url,
            createdAt: Date.now(),
          })
        }

        // Revoke preview URL after upload
        if (targetPhoto.previewUrl) {
          URL.revokeObjectURL(targetPhoto.previewUrl)
        }

        // Proceed to next step
        onSubmit?.()
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Failed to save photo',
        )
        setIsUploading(false)
      }
    },
    [photo, sessionId, projectId, step.id, setCapturedMedia, onSubmit],
  )

  // Library picker for fallback
  const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
    onSelect: (selectedPhoto) => {
      // Library picker bypasses camera, upload directly
      handleConfirmAndUpload(selectedPhoto)
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
  }, [setStatus])

  // Handle camera error
  const handleCameraError = useCallback((err: CameraCaptureError) => {
    console.error('Camera error:', err)
  }, [])

  // Derive error message for error state
  const errorMessage =
    uploadError || error?.message || 'Failed to capture photo'

  // Permission: unknown (loading)
  if (permStatus === 'unknown') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <PermissionLoading />
      </StepLayout>
    )
  }

  // Permission: undetermined (prompt to allow)
  if (permStatus === 'undetermined') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <PermissionPrompt onRequestPermission={requestPermission} />
      </StepLayout>
    )
  }

  // Permission: denied (show instructions + fallback)
  if (permStatus === 'denied') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <PermissionDenied
          fileInputRef={fileInputRef}
          onOpenPicker={openPicker}
          onFileChange={handleFileChange}
        />
      </StepLayout>
    )
  }

  // Permission: unavailable (no hardware)
  if (permStatus === 'unavailable') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <PermissionUnavailable
          fileInputRef={fileInputRef}
          onOpenPicker={openPicker}
          onFileChange={handleFileChange}
        />
      </StepLayout>
    )
  }

  // Permission granted - show capture flow

  // Uploading state
  if (isUploading) {
    return (
      <StepLayout hideButton>
        <UploadProgress photo={photo} aspectRatio={aspectRatio} />
      </StepLayout>
    )
  }

  // Error state
  if (captureStatus === 'error' || uploadError) {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <CaptureError
          errorMessage={errorMessage}
          fileInputRef={fileInputRef}
          onRetry={handleRetry}
          onOpenPicker={openPicker}
          onFileChange={handleFileChange}
        />
      </StepLayout>
    )
  }

  // Photo preview state
  if (captureStatus === 'photo-preview' && photo) {
    return (
      <StepLayout hideButton>
        <PhotoPreview
          photo={photo}
          aspectRatio={aspectRatio}
          onRetake={retake}
          onConfirm={handleConfirm}
        />
      </StepLayout>
    )
  }

  // Camera active state (default)
  return (
    <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
      <CameraActive
        cameraRef={cameraRef}
        aspectRatio={aspectRatio}
        fileInputRef={fileInputRef}
        onCameraReady={handleCameraReady}
        onCameraError={handleCameraError}
        onCapture={capture}
        onOpenPicker={openPicker}
        onFileChange={handleFileChange}
      />
    </StepLayout>
  )
}
