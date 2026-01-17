/**
 * Capture Photo Renderer
 *
 * Renderer for photo capture steps with full camera integration.
 * Shows camera placeholder with aspect ratio indicator using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display of camera placeholder
 * - Run mode: Full camera integration with capture, review, and upload
 *
 * Permission States (run mode):
 * - unknown: Loading spinner while checking permission
 * - undetermined: Prompt to request camera access
 * - granted: Full capture flow
 * - denied: Fallback to file upload with instructions
 * - unavailable: No camera hardware, fallback to file upload
 *
 * Capture States (run mode, after permission granted):
 * - idle/camera-active: Live camera feed with Take Photo button
 * - photo-preview: Captured photo with Retake/Continue buttons
 * - uploading: Progress indicator while saving
 * - error: Error message with retry option
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Loader2 } from 'lucide-react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { nanoid } from 'nanoid'
import { useExperienceRuntimeStore } from '../../runtime/stores/experienceRuntimeStore'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'
import type { CameraViewRef, CapturedPhoto } from '@/shared/camera'
import {
  CameraView,
  getDeniedInstructions,
  useCameraPermission,
  useLibraryPicker,
  usePhotoCapture,
} from '@/shared/camera'
import { ThemedButton, ThemedText, useEventTheme } from '@/shared/theming'
import { storage } from '@/integrations/firebase/client'

/**
 * Upload captured photo to Firebase Storage
 */
async function uploadCapturedPhoto({
  photo,
  projectId,
  sessionId,
  stepId,
}: {
  photo: CapturedPhoto
  projectId: string
  sessionId: string
  stepId: string
}): Promise<{ assetId: string; url: string }> {
  const assetId = nanoid()
  const path = `projects/${projectId}/sessions/${sessionId}/inputs/${assetId}.jpg`

  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, photo.file, {
    contentType: 'image/jpeg',
    customMetadata: {
      stepId,
      sessionId,
      captureMethod: photo.method,
      capturedAt: new Date().toISOString(),
    },
  })

  const url = await getDownloadURL(storageRef)
  return { assetId, url }
}

export function CapturePhotoRenderer({
  step,
  mode,
  onSubmit,
  onBack,
  canGoBack,
}: StepRendererProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config
  const { theme } = useEventTheme()

  // Calculate dimensions based on aspect ratio
  const isSquare = aspectRatio === '1:1'

  // Edit mode: return placeholder
  if (mode === 'edit') {
    return (
      <StepLayout hideButton>
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Camera placeholder with aspect ratio */}
          <div
            className={`flex flex-col items-center justify-center rounded-lg ${
              isSquare ? 'h-64 w-64' : 'h-80 w-44'
            }`}
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
            }}
          >
            <Camera
              className="h-16 w-16"
              style={{ color: theme.text.color, opacity: 0.5 }}
            />
            <ThemedText variant="body" className="mt-3 opacity-60">
              Camera
            </ThemedText>
          </div>

          {/* Aspect ratio indicator */}
          <ThemedText variant="small" className="opacity-60">
            Aspect ratio: {aspectRatio}
          </ThemedText>
        </div>
      </StepLayout>
    )
  }

  // Run mode: full camera integration
  return (
    <CapturePhotoRunMode
      step={step}
      aspectRatio={aspectRatio}
      isSquare={isSquare}
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
    />
  )
}

/**
 * Run mode component with camera integration
 * Separated to avoid hook rules issues with early returns
 */
function CapturePhotoRunMode({
  step,
  aspectRatio,
  isSquare,
  onSubmit,
  onBack,
  canGoBack,
}: {
  step: StepRendererProps['step']
  aspectRatio: '1:1' | '9:16'
  isSquare: boolean
  onSubmit?: () => void
  onBack?: () => void
  canGoBack?: boolean
}) {
  const { theme } = useEventTheme()

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

  // Library picker for fallback
  const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
    onSelect: (selectedPhoto) => {
      // Set photo directly in usePhotoCapture state
      // We need to manually set the photo state since library picker bypasses camera
      handleLibraryPhoto(selectedPhoto)
    },
    onError: (err) => {
      setUploadError(err.message)
    },
  })

  // Handle photo from library picker
  const handleLibraryPhoto = useCallback(
    (selectedPhoto: CapturedPhoto) => {
      // We can't directly set photo in usePhotoCapture, so we'll handle it separately
      handleConfirmAndUpload(selectedPhoto)
    },
    [sessionId, projectId, step.id, setCapturedMedia, onSubmit],
  )

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
          const { assetId, url } = await uploadCapturedPhoto({
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

  /**
   * Handle confirm button click
   */
  const handleConfirm = useCallback(async () => {
    await handleConfirmAndUpload()
  }, [handleConfirmAndUpload])

  // Permission: unknown (loading)
  if (permStatus === 'unknown') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Loader2
            className="h-12 w-12 animate-spin"
            style={{ color: theme.text.color, opacity: 0.5 }}
          />
          <ThemedText variant="body" className="opacity-60">
            Preparing camera...
          </ThemedText>
        </div>
      </StepLayout>
    )
  }

  // Permission: undetermined (prompt to allow)
  if (permStatus === 'undetermined') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-8">
          {/* Camera icon */}
          <div
            className="p-6 rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
            }}
          >
            <Camera className="h-12 w-12" style={{ color: theme.text.color }} />
          </div>

          {/* Header */}
          <ThemedText variant="heading" className="text-center">
            Camera Access Needed
          </ThemedText>

          {/* Description */}
          <ThemedText variant="body" className="text-center opacity-80">
            We need camera access to take your photo
          </ThemedText>

          {/* Action button */}
          <ThemedButton
            onClick={requestPermission}
            size="lg"
            className="w-full"
          >
            Allow Camera
          </ThemedButton>
        </div>
      </StepLayout>
    )
  }

  // Permission: denied (show instructions + fallback)
  if (permStatus === 'denied') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-8">
          {/* Camera off icon */}
          <div
            className="p-6 rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
            }}
          >
            <CameraOff
              className="h-12 w-12"
              style={{ color: theme.text.color }}
            />
          </div>

          {/* Header */}
          <ThemedText variant="heading" className="text-center">
            Camera Blocked
          </ThemedText>

          {/* Instructions */}
          <ThemedText variant="body" className="text-center opacity-80">
            {getDeniedInstructions()}
          </ThemedText>

          {/* Fallback button */}
          <ThemedButton onClick={openPicker} size="lg" className="w-full">
            Upload a Photo Instead
          </ThemedButton>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </StepLayout>
    )
  }

  // Permission: unavailable (no hardware)
  if (permStatus === 'unavailable') {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-8">
          {/* Camera off icon */}
          <div
            className="p-6 rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
            }}
          >
            <CameraOff
              className="h-12 w-12"
              style={{ color: theme.text.color }}
            />
          </div>

          {/* Header */}
          <ThemedText variant="heading" className="text-center">
            No Camera Detected
          </ThemedText>

          {/* Description */}
          <ThemedText variant="body" className="text-center opacity-80">
            Your device doesn't have a camera, but you can upload a photo
            instead.
          </ThemedText>

          {/* Fallback button */}
          <ThemedButton onClick={openPicker} size="lg" className="w-full">
            Upload a Photo
          </ThemedButton>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </StepLayout>
    )
  }

  // Permission granted - show capture flow

  // Uploading state
  if (isUploading) {
    return (
      <StepLayout hideButton>
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Preview image */}
          {photo?.previewUrl && (
            <div
              className={`relative overflow-hidden rounded-lg ${
                isSquare ? 'w-64 h-64' : 'w-44 h-80'
              }`}
            >
              <img
                src={photo.previewUrl}
                alt="Uploading photo"
                className="w-full h-full object-cover"
              />
              {/* Overlay with spinner */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2
                  className="h-12 w-12 animate-spin"
                  style={{ color: 'white' }}
                />
              </div>
            </div>
          )}

          <ThemedText variant="body" className="opacity-80">
            Saving your photo...
          </ThemedText>
        </div>
      </StepLayout>
    )
  }

  // Error state
  if (captureStatus === 'error' || uploadError) {
    return (
      <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-8">
          {/* Error icon */}
          <div
            className="p-6 rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
            }}
          >
            <CameraOff
              className="h-12 w-12"
              style={{ color: theme.text.color }}
            />
          </div>

          {/* Header */}
          <ThemedText variant="heading" className="text-center">
            Something went wrong
          </ThemedText>

          {/* Error message */}
          <ThemedText variant="body" className="text-center opacity-80">
            {uploadError || error?.message || 'Failed to capture photo'}
          </ThemedText>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <ThemedButton
              onClick={() => {
                setUploadError(null)
                retake()
              }}
              size="lg"
              className="w-full"
            >
              Try Again
            </ThemedButton>
            <ThemedButton
              onClick={openPicker}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Upload a Photo Instead
            </ThemedButton>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </StepLayout>
    )
  }

  // Photo preview state
  if (captureStatus === 'photo-preview' && photo) {
    return (
      <StepLayout hideButton>
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Preview image */}
          <div
            className={`overflow-hidden rounded-lg ${
              isSquare ? 'w-64 h-64' : 'w-44 h-80'
            }`}
          >
            <img
              src={photo.previewUrl}
              alt="Captured photo preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 w-full max-w-xs">
            <ThemedButton
              onClick={retake}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Retake
            </ThemedButton>
            <ThemedButton onClick={handleConfirm} size="lg" className="flex-1">
              Continue
            </ThemedButton>
          </div>
        </div>
      </StepLayout>
    )
  }

  // Camera active state (default)
  return (
    <StepLayout hideButton onBack={onBack} canGoBack={canGoBack}>
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Camera view */}
        <div className="flex-1 w-full rounded-lg overflow-hidden flex items-center justify-center">
          <CameraView
            ref={cameraRef}
            aspectRatio={aspectRatio}
            className="w-full h-full"
            onReady={() => setStatus('camera-active')}
            onError={(err) => {
              console.error('Camera error:', err)
            }}
          />
        </div>

        {/* Capture button */}
        <ThemedButton onClick={capture} size="lg" className="w-full max-w-xs">
          Take Photo
        </ThemedButton>

        {/* Upload fallback option */}
        <button
          type="button"
          onClick={openPicker}
          className="text-sm opacity-60 underline"
          style={{ color: theme.text.color }}
        >
          Or upload a photo instead
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </StepLayout>
  )
}
