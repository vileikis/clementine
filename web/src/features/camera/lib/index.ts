/**
 * Camera Module Lib - Barrel Export
 */

export {
  captureFromVideo,
  captureFromVideoMirrored,
  createCaptureFile,
} from "./capture";

export { getImageDimensions, getVideoDimensions } from "./image-utils";

export type { ImageDimensions } from "./image-utils";
