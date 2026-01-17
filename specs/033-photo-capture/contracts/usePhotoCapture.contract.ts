/**
 * usePhotoCapture Hook Contract
 *
 * This file defines the interface contract for the usePhotoCapture hook.
 * The hook orchestrates the photo capture flow, managing state transitions
 * between camera active, photo preview, and upload states.
 *
 * Location: apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.ts
 */

import type { RefObject } from 'react'

// =============================================================================
// Imported Types (from existing camera module)
// =============================================================================

/**
 * Reference to CameraView component for imperative photo capture.
 * @see apps/clementine-app/src/shared/camera/components/CameraView.tsx
 */
interface CameraViewRef {
  takePhoto: () => Promise<CapturedPhoto | null>
  switchCamera: () => Promise<void>
  facing: 'user' | 'environment'
  hasMultipleCameras: boolean
}

/**
 * Result of a photo capture operation.
 * @see apps/clementine-app/src/shared/camera/types/camera.types.ts
 */
interface CapturedPhoto {
  previewUrl: string
  file: File
  method: 'camera' | 'library'
  width: number
  height: number
}

/**
 * Camera error details.
 * @see apps/clementine-app/src/shared/camera/types/camera.types.ts
 */
interface CameraCaptureError {
  code: string
  message: string
}

// =============================================================================
// New Types (defined by this feature)
// =============================================================================

/**
 * Status states for the photo capture flow.
 */
export type PhotoCaptureStatus =
  | 'idle'
  | 'camera-active'
  | 'photo-preview'
  | 'uploading'
  | 'error'

/**
 * Options for initializing the usePhotoCapture hook.
 */
export interface UsePhotoCaptureOptions {
  /**
   * Reference to the CameraView component.
   * Required for calling takePhoto().
   */
  cameraRef: RefObject<CameraViewRef>

  /**
   * Called when a photo is captured (before confirmation).
   * Use for analytics or preview customization.
   */
  onCapture?: (photo: CapturedPhoto) => void
}

/**
 * Return value of the usePhotoCapture hook.
 */
export interface UsePhotoCaptureReturn {
  /**
   * Current status of the capture flow.
   * UI should render based on this value.
   */
  status: PhotoCaptureStatus

  /**
   * The captured photo, available when status is 'photo-preview'.
   * Contains previewUrl for display and file for upload.
   */
  photo: CapturedPhoto | null

  /**
   * Error details when status is 'error'.
   * Use to display appropriate error message and recovery options.
   */
  error: CameraCaptureError | null

  /**
   * Capture a photo from the camera.
   * Transitions from 'camera-active' to 'photo-preview'.
   *
   * @throws Sets status to 'error' if capture fails
   */
  capture: () => Promise<void>

  /**
   * Discard the current photo and return to camera.
   * Transitions from 'photo-preview' or 'error' to 'camera-active'.
   * Revokes the preview blob URL to free memory.
   */
  retake: () => void

  /**
   * Confirm the captured photo.
   * Caller is responsible for upload; this just signals completion.
   * Returns the captured photo for the caller to handle.
   *
   * @returns The captured photo, or throws if no photo available
   */
  confirm: () => Promise<CapturedPhoto>

  /**
   * Reset to initial idle state.
   * Useful for cleanup or restarting the flow.
   */
  reset: () => void
}

// =============================================================================
// Hook Signature
// =============================================================================

/**
 * Hook for orchestrating photo capture flow.
 *
 * @example
 * ```tsx
 * const cameraRef = useRef<CameraViewRef>(null)
 *
 * const { status, photo, capture, retake, confirm } = usePhotoCapture({
 *   cameraRef,
 *   onCapture: (photo) => console.log('Photo captured:', photo)
 * })
 *
 * // Render based on status
 * if (status === 'camera-active') {
 *   return (
 *     <>
 *       <CameraView ref={cameraRef} />
 *       <button onClick={capture}>Take Photo</button>
 *     </>
 *   )
 * }
 *
 * if (status === 'photo-preview' && photo) {
 *   return (
 *     <>
 *       <img src={photo.previewUrl} />
 *       <button onClick={retake}>Retake</button>
 *       <button onClick={handleConfirm}>Continue</button>
 *     </>
 *   )
 * }
 * ```
 */
export declare function usePhotoCapture(
  options: UsePhotoCaptureOptions,
): UsePhotoCaptureReturn
