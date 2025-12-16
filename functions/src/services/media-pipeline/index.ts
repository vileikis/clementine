/**
 * Media Pipeline Service
 *
 * Public API for media processing pipeline
 */

// Pipeline processors
export { processSingleImage } from './image.pipeline';
export { processGIF } from './gif.pipeline';
export { processVideo } from './video.pipeline';

// Configuration
export { getPipelineConfig, detectOutputFormat } from './config';

// FFmpeg operations
export {
  scaleAndCropImage,
  generateThumbnail,
  createGIF,
  createMP4,
  FFmpegError,
} from './ffmpeg';

// Types
export type { PipelineConfig } from '@clementine/shared';
