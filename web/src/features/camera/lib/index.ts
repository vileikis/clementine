/**
 * Camera Module Lib - Barrel Export
 */

export {
  captureFromVideo,
  captureFromVideoMirrored,
  createCaptureFile,
} from "./capture";

export { getImageDimensions, getVideoDimensions } from "./image-utils";

export {
  parseMediaError,
  createUnavailableError,
  isMediaDevicesAvailable,
  checkCameraPermission,
} from "./errors";

export type { ImageDimensions } from "./image-utils";
