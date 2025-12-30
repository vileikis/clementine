/**
 * CameraCapture Component
 *
 * Main container component for the camera capture flow.
 * Uses Expo-style pattern: permission hook + auto-starting CameraView.
 *
 * Architecture:
 * - useCameraPermission: Handles permission state
 * - CameraView: Self-contained camera (auto-starts on mount)
 * - useLibraryPicker: Handles file input for library selection
 * - cameraReducer: Tracks UI state (camera-active, photo-review, error)
 */

import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import { DEFAULT_LABELS } from '../constants'
import { INITIAL_CAMERA_STATE, cameraReducer } from '../lib'
import { useCameraPermission } from '../hooks/useCameraPermission'
import { useLibraryPicker } from '../hooks/useLibraryPicker'
import { PermissionPrompt } from '../components/PermissionPrompt'
import { CameraView } from '../components/CameraView'
import { CameraControls } from '../components/CameraControls'
import { PhotoReview } from '../components/PhotoReview'
import { ErrorState } from '../components/ErrorState'
import type { CameraViewRef } from '../components/CameraView'
import type {
  AspectRatio,
  CameraCaptureError,
  CameraCaptureLabels,
  CameraFacing,
  CameraFacingConfig,
  CapturedPhoto,
} from '../types'
import { cn } from '@/shared/utils'

export interface CameraCaptureProps {
  /** Called when photo taken/selected (enters review) */
  onPhoto?: (photo: CapturedPhoto) => void
  /** Called when user confirms photo (required) */
  onSubmit: (photo: CapturedPhoto) => void
  /** Called when user taps retake */
  onRetake?: () => void
  /** Called when user wants to exit */
  onCancel?: () => void
  /** Called on any error */
  onError?: (error: CameraCaptureError) => void
  /** Show library selection option as secondary input method */
  enableLibrary?: boolean
  /** Available camera(s) - "user", "environment", or "both" */
  cameraFacing?: CameraFacingConfig
  /** Starting camera when cameraFacing="both" */
  initialFacing?: CameraFacing
  /** Aspect ratio guide overlay */
  aspectRatio?: AspectRatio
  /** Container CSS class */
  className?: string
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels
}

/**
 * CameraCapture - Main camera capture component
 *
 * Provides complete photo capture flow with:
 * - Permission request UI
 * - Live camera preview
 * - Photo capture
 * - Photo review with confirm/retake
 *
 * @example
 * ```tsx
 * <CameraCapture
 *   onSubmit={async (photo) => {
 *     const url = await uploadToStorage(photo.file);
 *     URL.revokeObjectURL(photo.previewUrl);
 *     console.log('Uploaded:', url);
 *   }}
 *   enableLibrary={true}
 *   aspectRatio="3:4"
 * />
 * ```
 */
export function CameraCapture({
  onPhoto,
  onSubmit,
  onRetake,
  // onCancel is reserved for future use
  onError,
  enableLibrary = true,
  cameraFacing = 'both',
  initialFacing = 'user',
  aspectRatio,
  className,
  labels = {},
}: CameraCaptureProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels }

  // Permission hook - handles permission state
  const {
    status: permissionStatus,
    requestPermission,
    error: permissionError,
  } = useCameraPermission()

  // UI state reducer - only used after permission granted
  const [state, dispatch] = useReducer(cameraReducer, INITIAL_CAMERA_STATE)

  // Ref for CameraView - used for takePhoto and switchCamera
  const cameraViewRef = useRef<CameraViewRef>(null)

  // Track hasMultipleCameras in state (updated via onReady callback)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Library picker hook - manages file input
  const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
    onSelect: (photo) => {
      onPhoto?.(photo)
      dispatch({ type: 'PHOTO_CAPTURED', photo })
    },
    onError,
  })

  // Target camera facing based on configuration
  const targetFacing = useMemo<CameraFacing>(
    () => (cameraFacing === 'both' ? initialFacing : cameraFacing),
    [cameraFacing, initialFacing],
  )

  // Handle camera ready
  const handleCameraReady = useCallback(() => {
    setHasMultipleCameras(cameraViewRef.current?.hasMultipleCameras ?? false)
  }, [])

  // Handle camera errors (hardware errors, not permission)
  const handleCameraError = useCallback(
    (error: CameraCaptureError) => {
      onError?.(error)
      dispatch({ type: 'ERROR', error })
    },
    [onError],
  )

  // Handle photo capture via CameraView ref
  const handleCapture = useCallback(async () => {
    const photo = await cameraViewRef.current?.takePhoto()
    if (photo) {
      onPhoto?.(photo)
      dispatch({ type: 'PHOTO_CAPTURED', photo })
    } else {
      onError?.({
        code: 'CAPTURE_FAILED',
        message: 'Failed to capture photo',
      })
    }
  }, [onPhoto, onError])

  // Handle camera flip via CameraView ref
  const handleFlipCamera = useCallback(async () => {
    await cameraViewRef.current?.switchCamera()
  }, [])

  // Handle retake
  const handleRetake = useCallback(() => {
    onRetake?.()
    dispatch({ type: 'RETAKE' })
  }, [onRetake])

  // Handle photo confirm
  const handleConfirm = useCallback(() => {
    if (state.status === 'photo-review') {
      onSubmit(state.photo)
    }
  }, [state, onSubmit])

  // Determine what controls to show
  const showFlipButton =
    cameraFacing === 'both' &&
    hasMultipleCameras &&
    state.status === 'camera-active'
  const showLibraryButton = enableLibrary

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Hidden file input for library selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Permission: unknown (checking) */}
      {permissionStatus === 'unknown' && (
        <div className="flex flex-col items-center justify-center gap-4 h-full bg-black">
          <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Preparing camera...</p>
        </div>
      )}

      {/* Permission: undetermined or denied - show prompt */}
      {(permissionStatus === 'undetermined' ||
        permissionStatus === 'denied') && (
        <PermissionPrompt
          labels={mergedLabels}
          permissionStatus={permissionStatus}
          onRequestPermission={requestPermission}
        />
      )}

      {/* Permission: unavailable - show error */}
      {permissionStatus === 'unavailable' && (
        <ErrorState
          error={
            permissionError ?? {
              code: 'CAMERA_UNAVAILABLE',
              message: 'Camera not available',
            }
          }
          labels={mergedLabels}
          showRetry={false}
          showLibraryFallback={enableLibrary}
          onOpenLibrary={openPicker}
        />
      )}

      {/* Permission: granted - show camera UI */}
      {permissionStatus === 'granted' && (
        <>
          {/* Camera active state */}
          {state.status === 'camera-active' && (
            <div className="flex flex-col h-full">
              {/* Camera view container - centers the aspect-ratio-constrained view */}
              <div className="flex-1 min-h-0 flex items-center justify-center bg-black">
                <CameraView
                  ref={cameraViewRef}
                  facing={targetFacing}
                  aspectRatio={aspectRatio}
                  onReady={handleCameraReady}
                  onError={handleCameraError}
                />
              </div>
              <CameraControls
                labels={mergedLabels}
                showFlipButton={showFlipButton}
                showLibraryButton={showLibraryButton}
                onCapture={handleCapture}
                onFlipCamera={handleFlipCamera}
                onOpenLibrary={openPicker}
              />
            </div>
          )}

          {/* Photo review state */}
          {state.status === 'photo-review' && (
            <PhotoReview
              photo={state.photo}
              labels={mergedLabels}
              onConfirm={handleConfirm}
              onRetake={handleRetake}
            />
          )}

          {/* Error state (hardware error) */}
          {state.status === 'error' && (
            <ErrorState
              error={state.error}
              labels={mergedLabels}
              showRetry
              showLibraryFallback={enableLibrary}
              onRetry={() => dispatch({ type: 'CAMERA_READY' })}
              onOpenLibrary={openPicker}
            />
          )}
        </>
      )}
    </div>
  )
}
