import * as fs from 'fs/promises';
import { FFmpegError, TIMEOUTS, runFFmpegCommand, validateInputFile } from './core';

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
  outputPath: string
): Promise<void> {
  await validateInputFile(inputPath);
  await validateInputFile(overlayPath);

  const args = [
    '-i', inputPath,
    '-i', overlayPath,
    '-filter_complex', '[1:v][0:v]scale2ref[scaled][source];[source][scaled]overlay=0:0:format=auto',
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
