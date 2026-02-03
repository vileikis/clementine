import * as fs from 'fs/promises';
import { FFmpegError, TIMEOUTS, runFFmpegCommand, validateInputFile } from './core';

/**
 * Create MP4 video from image sequence
 *
 * @param framePaths - Array of frame file paths
 * @param outputPath - Path to output MP4
 * @param width - Target width
 * @param height - Target height
 */
export async function createMP4(
  framePaths: string[],
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  // Validate all input frames
  await Promise.all(framePaths.map((path) => validateInputFile(path)));

  // Validate we have frames
  const firstFrame = framePaths[0];
  if (!firstFrame) {
    throw new FFmpegError('No frames provided for MP4', 'validation', {
      frameCount: framePaths.length,
    });
  }

  const frameDir = firstFrame.substring(0, firstFrame.lastIndexOf('/'));
  const framePattern = `${frameDir}/frame-%03d.jpg`;

  const args = [
    '-framerate', '5',
    '-i', framePattern,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-r', '5',
    '-g', '15',
    '-keyint_min', '15',
    '-movflags', '+faststart',
    '-vf', `scale=${width}:${height}:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
    '-an', // No audio
    '-y', // Overwrite output file
    outputPath
  ];

  const timeout = framePaths.length < 10 ? TIMEOUTS.mp4_short : TIMEOUTS.mp4_long;
  await runFFmpegCommand(args, {
    timeout,
    description: 'MP4 creation',
  });

  // Validate output
  const outputStats = await fs.stat(outputPath);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty MP4', 'unknown', {
      frameCount: framePaths.length,
      outputPath,
    });
  }
}
