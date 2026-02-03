/**
 * FFmpeg Service
 *
 * Low-level FFmpeg utilities for media processing.
 */

// Core infrastructure
export { FFmpegError, TIMEOUTS } from './core'

// Image operations
export { scaleAndCropImage, generateThumbnail } from './images'

// GIF operations
export { createGIF, scaleAndCropGIF } from './gifs'

// Video operations
export { createMP4 } from './videos'

// Overlay/compositing
export { applyOverlayToMedia } from './overlay'
