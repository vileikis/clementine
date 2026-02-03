import * as fs from 'fs/promises';
import { FFmpegError, TIMEOUTS, runFFmpegCommand, validateInputFile } from './core';

/**
 * Generate palette for GIF from concat file
 */
async function generatePalette(
  concatFilePath: string,
  palettePath: string,
  width: number,
  fps: number = 2
): Promise<void> {
  const args = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-vf', `scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=256`,
    '-frames:v', '1', // Generate single palette frame
    '-y', // Overwrite output file
    palettePath
  ];

  await runFFmpegCommand(args, {
    timeout: TIMEOUTS.gif_small,
    description: 'GIF palette generation',
  });

  // Validate output
  const outputStats = await fs.stat(palettePath);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty palette', 'unknown', {
      palettePath,
    });
  }
}

/**
 * Create GIF from image sequence using palette
 *
 * Uses FFmpeg concat demuxer to avoid file duplication for boomerang effects.
 *
 * @param framePaths - Array of frame file paths (can contain duplicates)
 * @param outputPath - Path to output GIF
 * @param width - Target width
 */
export async function createGIF(
  framePaths: string[],
  outputPath: string,
  width: number,
  fps: number = 2
): Promise<void> {
  // Validate we have frames
  if (framePaths.length === 0) {
    throw new FFmpegError('No frames provided for GIF', 'validation', {
      frameCount: 0,
    });
  }

  // Validate unique frames exist (framePaths may have duplicates for boomerang)
  const uniqueFrames = Array.from(new Set(framePaths));
  await Promise.all(uniqueFrames.map((path) => validateInputFile(path)));

  // Create concat file in same directory as frames
  const frameDir = framePaths[0]!.substring(0, framePaths[0]!.lastIndexOf('/'));
  const concatFilePath = `${frameDir}/concat.txt`;
  const palettePath = `${frameDir}/palette.png`;

  try {
    // Create concat file listing all frames in order with duration
    // Format: file 'path' / duration X / file 'path' ...
    // For smooth looping GIFs, all frames should have the same duration
    const frameDuration = 1 / fps; // e.g., 2 fps = 0.5s per frame
    const concatLines: string[] = [];

    for (let i = 0; i < framePaths.length; i++) {
      concatLines.push(`file '${framePaths[i]}'`);
      concatLines.push(`duration ${frameDuration}`);
    }

    const concatContent = concatLines.join('\n');
    await fs.writeFile(concatFilePath, concatContent, 'utf-8');

    // Generate palette from concat file
    await generatePalette(concatFilePath, palettePath, width, fps);

    // Create GIF using palette
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-i', palettePath,
      '-filter_complex', `scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      '-loop', '0',
      '-y', // Overwrite output file
      outputPath
    ];

    const timeout = framePaths.length < 5 ? TIMEOUTS.gif_small : TIMEOUTS.gif_large;
    await runFFmpegCommand(args, {
      timeout,
      description: 'GIF creation',
    });

    // Validate output
    const outputStats = await fs.stat(outputPath);
    if (outputStats.size === 0) {
      throw new FFmpegError('FFmpeg produced empty GIF', 'unknown', {
        frameCount: framePaths.length,
        outputPath,
      });
    }
  } finally {
    // Cleanup temporary files (frames will be cleaned up by caller)
    try {
      await Promise.all([
        fs.unlink(concatFilePath).catch(() => {}),
        fs.unlink(palettePath).catch(() => {}),
      ]);
    } catch (err) {
      // Ignore cleanup errors
      console.warn(`Failed to cleanup temporary files: ${(err as Error).message}`);
    }
  }
}

/**
 * Scale and crop GIF to target dimensions with center-crop
 *
 * @param inputPath - Path to input GIF
 * @param outputPath - Path to output GIF
 * @param width - Target width
 * @param height - Target height
 */
export async function scaleAndCropGIF(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  await validateInputFile(inputPath);

  const args = [
    '-i', inputPath,
    '-vf', `scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=increase,crop=${width}:${height}:(iw-${width})/2:(ih-${height})/2`,
    '-y', // Overwrite output file
    outputPath
  ];

  await runFFmpegCommand(args, {
    timeout: TIMEOUTS.gif_large, // Use GIF timeout
    description: 'GIF scaling and cropping',
  });

  // Validate output
  const outputStats = await fs.stat(outputPath);
  if (outputStats.size === 0) {
    throw new FFmpegError('FFmpeg produced empty GIF after scaling', 'unknown', {
      inputPath,
      outputPath,
    });
  }
}
