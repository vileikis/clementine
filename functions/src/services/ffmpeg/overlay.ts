import * as fs from 'fs/promises';
import { FFmpegError, TIMEOUTS, runFFmpegCommand, validateInputFile } from './core';

/**
 * Apply overlay image on top of media (image/GIF/video)
 *
 * FFmpeg automatically applies overlay to all frames for animated formats (GIF/video).
 * No scaling or positioning - overlay is composited at (0,0) covering the full frame.
 *
 * @param inputPath - Path to base media (image.jpg, output.gif, or video.mp4)
 * @param overlayPath - Path to overlay PNG (already downloaded)
 * @param outputPath - Path for composited result
 */
export async function applyOverlayToMedia(
  inputPath: string,
  overlayPath: string,
  outputPath: string
): Promise<void> {
  await validateInputFile(inputPath);
  await validateInputFile(overlayPath);

  const args = [
    '-i', inputPath,
    '-i', overlayPath,
    '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto',
    '-y', // Overwrite output file
    outputPath
  ];

  await runFFmpegCommand(args, {
    timeout: TIMEOUTS.overlay,
    description: 'Overlay composition',
  });

  // Validate output
  const outputStats = await fs.stat(outputPath);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty output with overlay', 'unknown', {
      inputPath,
      overlayPath,
      outputPath,
    });
  }
}
