/**
 * Camera Module Constants
 *
 * Error codes, default labels, and configuration constants.
 */

import type { AspectRatio, CameraCaptureLabels } from './types/camera.types'

/**
 * Aspect ratio to CSS aspect-ratio value mapping.
 * Shared between CameraView (video) and PhotoFrame (image).
 */
export const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

/**
 * Default labels for internationalization (English)
 */
export const DEFAULT_LABELS: Required<CameraCaptureLabels> = {
  permissionTitle: 'Camera Access',
  permissionDescription: 'We need camera access to take your photo',
  allowCamera: 'Allow Camera',
  capture: 'Take Photo',
  flipCamera: 'Switch Camera',
  openLibrary: 'Choose from Library',
  retake: 'Retake',
  confirm: 'Use Photo',
  cancel: 'Cancel',
  retry: 'Try Again',
  permissionDenied: 'Camera access denied',
  permissionDeniedHint: 'Please enable camera in your browser settings',
  permissionDismissed: 'Permission request dismissed',
  cameraUnavailable: 'Camera not available',
  cameraUnavailableHint: 'You can still upload a photo from your library',
  cameraInUse: 'Camera is in use',
  cameraInUseHint: 'Close other apps using the camera and try again',
  captureError: 'Failed to capture photo',
  invalidFileType: 'Invalid file type',
  unknownError: 'Something went wrong',
}

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED:
    'Camera permission denied. Please allow camera access to continue.',
  PERMISSION_DISMISSED: 'Camera permission request was dismissed.',
  CAMERA_UNAVAILABLE: 'No camera found on this device.',
  CAMERA_IN_USE: 'Camera is already in use by another application.',
  CAPTURE_FAILED: 'Failed to capture photo. Please try again.',
  INVALID_FILE_TYPE: 'Please select an image file (JPEG, PNG, GIF, or WebP).',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
}

/**
 * Accepted image MIME types for file validation
 */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * Camera constraints for getUserMedia
 *
 * We request high resolution without forcing orientation.
 * The browser will adapt based on device orientation:
 * - Desktop: typically landscape
 * - Mobile portrait: browser swaps to portrait automatically
 * - Mobile landscape: stays landscape
 *
 * The actual dimensions are in video.videoWidth/videoHeight.
 * We crop to the desired aspectRatio on capture.
 */
export const CAMERA_CONSTRAINTS = {
  width: { ideal: 3840 },
  height: { ideal: 3840 },
} as const

/**
 * JPEG quality for canvas capture (0-1)
 * 0.92 is a good balance between quality and file size
 */
export const CAPTURE_QUALITY = 0.92
