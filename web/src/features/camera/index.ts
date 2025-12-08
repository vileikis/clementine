/**
 * Camera Module - Public API
 *
 * Only exports the main component and types needed by consumers.
 * Internal components and utilities are not exposed.
 */

// Main component
export { CameraCapture } from "./components/CameraCapture";

// Public types
export type {
  CapturedPhoto,
  CameraCaptureError,
  CameraCaptureErrorCode,
  CaptureMethod,
  CameraCaptureProps,
  CameraCaptureLabels,
  AspectRatio,
  CameraFacing,
  CameraFacingConfig,
} from "./types";

// Default labels for consumers who want to customize
export { DEFAULT_LABELS } from "./constants";
