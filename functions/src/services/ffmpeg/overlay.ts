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
  console.log(`[applyOverlayToMedia] Input: ${inputPath}`);
  console.log(`[applyOverlayToMedia] Overlay: ${overlayPath}`);
  console.log(`[applyOverlayToMedia] Output: ${outputPath}`);

  await validateInputFile(inputPath);
  await validateInputFile(overlayPath);

  // Get input file stats for debugging
  const inputStats = await fs.stat(inputPath);
  const overlayStats = await fs.stat(overlayPath);
  console.log(`[applyOverlayToMedia] Input size: ${inputStats.size} bytes`);
  console.log(`[applyOverlayToMedia] Overlay size: ${overlayStats.size} bytes`);

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
  console.log(`[applyOverlayToMedia] Output size: ${outputStats.size} bytes`);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty output with overlay', 'unknown', {
      inputPath,
      overlayPath,
      outputPath,
    });
  }
}
