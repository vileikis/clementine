import * as fs from 'fs/promises';
import { FFmpegError, TIMEOUTS, runFFmpegCommand, validateInputFile } from './core';

/**
 * Scale and crop image to target dimensions with center-crop
 *
 * @param inputPath - Path to input image
 * @param outputPath - Path to output image
 * @param width - Target width
 * @param height - Target height
 */
export async function scaleAndCropImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  await validateInputFile(inputPath);

  const args = [
    '-i', inputPath,
    '-vf', `scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=increase,crop=${width}:${height}:(iw-${width})/2:(ih-${height})/2`,
    '-q:v', '2',
    '-y', // Overwrite output file
    outputPath
  ];

  await runFFmpegCommand(args, {
    timeout: TIMEOUTS.image_scale,
    description: 'Image scaling',
  });

  // Validate output
  const outputStats = await fs.stat(outputPath);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty output file', 'unknown', {
      inputPath,
      outputPath,
    });
  }
}

/**
 * Generate thumbnail with Lanczos scaling
 *
 * @param inputPath - Path to input image/video
 * @param outputPath - Path to output thumbnail
 * @param width - Thumbnail width (default: 300)
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  width: number = 300
): Promise<void> {
  await validateInputFile(inputPath);

  const args = [
    '-i', inputPath,
    '-vf', `scale=${width}:-1:flags=lanczos`,
    '-q:v', '2',
    '-frames:v', '1',
    '-y', // Overwrite output file
    outputPath
  ];

  await runFFmpegCommand(args, {
    timeout: TIMEOUTS.thumbnail,
    description: 'Thumbnail generation',
  });

  // Validate output
  const outputStats = await fs.stat(outputPath);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty thumbnail', 'unknown', {
      inputPath,
      outputPath,
    });
  }
}
