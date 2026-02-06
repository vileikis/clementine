/**
 * usePhotoCapture Hook
 *
 * Orchestrates the photo capture flow state machine.
 * Manages capture, preview, and confirmation states.
 *
 * This hook is designed to be used with CameraView component
 * and provides all the state management for the capture flow.
 *
 * @example
 * ```tsx
 * const cameraRef = useRef<CameraViewRef>(null)
 * const { status, photo, capture, retake, confirm, setStatus } = usePhotoCapture({
 *   cameraRef,
 *   onCapture: (photo) => console.log('Captured:', photo),
 * })
 *
 * // Start camera when ready
 * useEffect(() => {
 *   if (permissionGranted) {
 *     setStatus('camera-active')
 *   }
 * }, [permissionGranted])
 *
 * // Take photo
 * await capture()
 *
 * // Review and confirm
 * const confirmedPhoto = await confirm()
 * // Now upload the confirmedPhoto.file to storage
 * ```
 */

import { useCallback, useState } from 'react'
import type {
  CameraCaptureError,
  CapturedPhoto,
  PhotoCaptureStatus,
  UsePhotoCaptureOptions,
  UsePhotoCaptureReturn,
} from '../types'
import type { CameraViewRef } from '../components/CameraView'

export type {
  PhotoCaptureStatus,
  UsePhotoCaptureOptions,
  UsePhotoCaptureReturn,
}

export function usePhotoCapture({
  cameraRef,
  onCapture,
}: UsePhotoCaptureOptions): UsePhotoCaptureReturn {
  const [status, setStatus] = useState<PhotoCaptureStatus>('idle')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [error, setError] = useState<CameraCaptureError | null>(null)

  /**
   * Capture a photo from the camera
   */
  const capture = useCallback(async () => {
    const camera = cameraRef.current as CameraViewRef | null
    if (!camera) return

    try {
      const capturedPhoto = await camera.takePhoto()
      if (capturedPhoto) {
        // Stop camera immediately after capture to release hardware
        // camera.stop()
        setPhoto(capturedPhoto)
        setStatus('photo-preview')
        onCapture?.(capturedPhoto)
      }
    } catch (err) {
      setError({
        code: 'CAPTURE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to capture photo',
      })
      setStatus('error')
    }
  }, [cameraRef, onCapture])

  /**
   * Discard captured photo and return to camera
   */
  const retake = useCallback(() => {
    // Revoke old preview URL to prevent memory leaks
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl)
    }
    setPhoto(null)
    setError(null)
    setStatus('camera-active')
  }, [photo])

  /**
   * Confirm the captured photo and return it
   */
  const confirm = useCallback((): CapturedPhoto => {
    if (!photo) {
      throw new Error('No photo to confirm')
    }
    return photo
  }, [photo])

  /**
   * Reset the hook to initial state
   */
  const reset = useCallback(() => {
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl)
    }
    setPhoto(null)
    setError(null)
    setStatus('idle')
  }, [photo])

  /**
   * Set a photo directly (e.g., from library picker) and go to preview
   */
  const setPhotoForPreview = useCallback(
    (selectedPhoto: CapturedPhoto) => {
      // Revoke old preview URL if any
      if (photo?.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl)
      }
      setPhoto(selectedPhoto)
      setError(null)
      setStatus('photo-preview')
    },
    [photo],
  )

  return {
    status,
    photo,
    error,
    capture,
    retake,
    confirm,
    reset,
    setStatus,
    setPhotoForPreview,
  }
}
