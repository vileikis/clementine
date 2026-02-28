/**
 * Overlay Application
 *
 * Applies overlay images to media files (images, GIFs, videos).
 * Uses ffprobe to get source dimensions, then scales overlay to match.
 * This approach is more memory-efficient than using -loop with scale2ref.
 */
import * as fs from 'fs/promises'
import { logger } from 'firebase-functions/v2'
import * as path from 'path'
import {
  FFmpegError,
  TIMEOUTS,
  runFFmpegCommand,
  validateInputFile,
} from './core'
import { getMediaDimensions, hasAudioStream } from './probe'

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv'])

/**
 * Apply overlay image on top of media (image/GIF/video)
 *
 * For images: Scales overlay to source dimensions, composites once
 * For GIFs/videos: Scales overlay to source dimensions, composites on all frames
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

  // Get source dimensions for overlay scaling
  const dimensions = await getMediaDimensions(inputPath)
  logger.info('[FFmpeg Overlay] Source dimensions', {
    width: dimensions.width,
    height: dimensions.height,
  })

  // Scale overlay to exact source dimensions, then composite
  // This avoids memory-hungry scale2ref and -loop tricks
  const filterComplex = `[1:v]scale=${dimensions.width}:${dimensions.height}[ov];[0:v][ov]overlay=0:0:format=auto`

  const isVideo = VIDEO_EXTENSIONS.has(path.extname(inputPath).toLowerCase())

  // For video inputs: passthrough audio if present, drop if absent
  const audioArgs: string[] = []
  if (isVideo) {
    const hasAudio = await hasAudioStream(inputPath)
    if (hasAudio) {
      audioArgs.push('-c:a', 'copy')
    } else {
      audioArgs.push('-an')
    }
  }

  const args = [
    '-i', inputPath,
    '-i', overlayPath,
    '-filter_complex', filterComplex,
    ...audioArgs,
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
