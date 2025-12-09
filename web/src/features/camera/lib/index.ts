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

export { cameraReducer, INITIAL_CAMERA_STATE } from "./cameraReducer";

export type { ImageDimensions } from "./image-utils";
