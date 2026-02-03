/**
 * Media Pipeline Service
 *
 * FFmpeg utilities for media processing.
 */

// FFmpeg operations
export {
  scaleAndCropImage,
  generateThumbnail,
  createGIF,
  createMP4,
  scaleAndCropGIF,
  applyOverlayToMedia,
  FFmpegError,
} from './ffmpeg'
