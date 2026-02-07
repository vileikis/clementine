import * as fs from 'fs/promises'
import { logger } from 'firebase-functions/v2'
import {
  FFmpegError,
  TIMEOUTS,
  runFFmpegCommand,
  validateInputFile,
} from './core'

/**
 * Apply overlay image on top of media (image/GIF/video)
 *
 * FFmpeg automatically applies overlay to all frames for animated formats (GIF/video).
 * Overlay is scaled to match source dimensions using scale2ref, then composited at (0,0).
 *
 * @param inputPath - Path to base media (image.jpg, output.gif, or video.mp4)
 * @param overlayPath - Path to overlay PNG (already downloaded)
 * @param outputPath - Path for composited result
 */
export async function applyOverlayToMedia(
  inputPath: string,
  overlayPath: string,
  outputPath: string,
): Promise<void> {
  await validateInputFile(inputPath)
  await validateInputFile(overlayPath)

  const filterComplex =
    '[1:v][0:v]scale2ref[scaled][source];[source][scaled]overlay=0:0:format=auto'

  // Check if input is a single-frame image (not GIF or video)
  const isStaticImage = /\.(jpe?g|png|webp)$/i.test(inputPath)

  // FFmpeg 7.x requires input looping for single-frame filter graphs
  // For GIFs/videos, we don't need looping - they already have multiple frames
  const args = isStaticImage
    ? [
        '-loop', '1',
        '-t', '0.1',  // Limit to 0.1s to prevent memory bloat
        '-i', inputPath,
        '-loop', '1',
        '-t', '0.1',
        '-i', overlayPath,
        '-filter_complex', filterComplex,
        '-frames:v', '1',
        '-y',
        outputPath,
      ]
    : [
        '-i', inputPath,
        '-loop', '1',  // Overlay is still a static image, needs looping for GIF/video
        '-i', overlayPath,
        '-filter_complex', filterComplex,
        '-y',
        outputPath,
      ]

  try {
    await runFFmpegCommand(args, {
      timeout: TIMEOUTS.overlay,
      description: 'Overlay composition',
    })
  } catch (error) {
    logger.error('[FFmpeg Overlay] Failed', {
      error: error instanceof Error ? error.message : String(error),
      stderr: (error as FFmpegError).details?.['stderr'],
    })
    throw error
  }

  // Validate output
  const outputStats = await fs.stat(outputPath)
  if (outputStats.size === 0) {
    throw new FFmpegError(
      'FFmpeg produced empty output with overlay',
      'unknown',
      {
        inputPath,
        overlayPath,
        outputPath,
      },
    )
  }
}
