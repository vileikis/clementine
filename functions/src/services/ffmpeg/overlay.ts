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

  // FFmpeg 7.x requires input looping for single-frame filter graphs
  const filterComplex =
    '[1:v][0:v]scale2ref[scaled][source];[source][scaled]overlay=0:0:format=auto'

  const args = [
    '-loop',
    '1',
    '-i',
    inputPath, // Loop input to create continuous frame stream
    '-loop',
    '1',
    '-i',
    overlayPath, // Loop overlay to create continuous frame stream
    '-filter_complex',
    filterComplex,
    '-frames:v',
    '1', // Output single frame
    '-y', // Overwrite output file
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
