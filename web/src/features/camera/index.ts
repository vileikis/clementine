/**
 * Camera Module - Public API
 *
 * Only exports the main component and types needed by consumers.
 * Internal components and utilities are not exposed.
 */

// Main component and its props
export { CameraCapture } from "./components/CameraCapture";
export type { CameraCaptureProps } from "./components/CameraCapture";

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
} from "./types";

// Default labels for consumers who want to customize
export { DEFAULT_LABELS } from "./constants";
