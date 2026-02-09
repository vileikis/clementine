/**
 * Camera Module - Public API
 *
 * Only exports the main component and types needed by consumers.
 * Internal components and utilities are not exposed.
 */

// Main component and its props
export { CameraCapture } from './containers/CameraCapture'
export type { CameraCaptureProps } from './containers/CameraCapture'

// CameraView component for custom integrations
export { CameraView } from './components/CameraView'
export type { CameraViewRef } from './components/CameraView'

// Components
export { AspectRatioControl } from './components/AspectRatioControl'
export { PhotoFrame } from './components/PhotoFrame'

// Hooks
export { useCameraPermission } from './hooks/useCameraPermission'
export { useCameraStream } from './hooks/useCameraStream'
export { useLibraryPicker } from './hooks/useLibraryPicker'
export { usePhotoCapture } from './hooks/usePhotoCapture'

// Public types
export type {
  CapturedPhoto,
  CameraCaptureError,
  CameraCaptureErrorCode,
  CaptureMethod,
  CameraCaptureLabels,
  AspectRatio,
  CameraFacing,
  CameraFacingConfig,
  PermissionState,
  PhotoCaptureStatus,
  UsePhotoCaptureOptions,
  UsePhotoCaptureReturn,
} from './types'

// Permission utilities
export { isMobileBrowser, getDeniedInstructions } from './lib/permission-utils'

// Constants
export { DEFAULT_LABELS, ASPECT_RATIO_CSS } from './constants'
