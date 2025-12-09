/**
 * Camera Module Lib - Barrel Export
 */

export {
  captureFromVideo,
  captureFromVideoMirrored,
  createCaptureFile,
} from "./capture";

export { getImageDimensions, getVideoDimensions } from "./image-utils";

export { parseMediaError, createUnavailableError } from "./errors";

export { isMediaDevicesAvailable, checkCameraPermission } from "./utils";

export type { ImageDimensions } from "./image-utils";
