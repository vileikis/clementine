import type { PipelineConfig } from '../../lib/schemas/media-pipeline.schema';

/**
 * Aspect ratio dimension mappings
 */
const ASPECT_RATIO_DIMENSIONS = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
} as const;

/**
 * Frame timing configuration
 */
const FRAME_TIMING = {
  gif: {
    frameDuration: 0.5, // 0.5 seconds per frame
    fps: 2, // 2 frames per second (1 / 0.5)
  },
  video: {
    frameDuration: 0.2, // 0.2 seconds per frame
    fps: 5, // 5 frames per second (1 / 0.2)
  },
} as const;

/**
 * Get pipeline configuration from request parameters
 *
 * @param outputFormat - Desired output format (image, gif, video)
 * @param aspectRatio - Target aspect ratio (square, story)
 * @returns Pipeline configuration with dimensions and timing
 */
export function getPipelineConfig(
  outputFormat: 'image' | 'gif' | 'video',
  aspectRatio: 'square' | 'story'
): PipelineConfig {
  const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  const timing =
    outputFormat === 'gif' ? FRAME_TIMING.gif : FRAME_TIMING.video;

  return {
    outputFormat,
    aspectRatio,
    outputWidth: dimensions.width,
    outputHeight: dimensions.height,
    frameDuration: timing.frameDuration,
    fps: timing.fps,
  };
}

/**
 * Detect output format based on input asset count and requested format
 *
 * @param requestedFormat - Format requested by client
 * @param inputCount - Number of input assets
 * @returns Actual output format to use
 */
export function detectOutputFormat(
  requestedFormat: 'image' | 'gif' | 'video',
  inputCount: number
): 'image' | 'gif' | 'video' {
  // If only one input, always produce single image
  if (inputCount === 1) {
    return 'image';
  }

  // For multiple inputs, respect requested format
  // If "image" requested with multiple inputs, fallback to GIF
  if (requestedFormat === 'image' && inputCount > 1) {
    return 'gif';
  }

  return requestedFormat;
}
