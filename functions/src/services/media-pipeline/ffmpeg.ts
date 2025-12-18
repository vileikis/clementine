import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import * as fs from 'fs/promises';

// Validate ffmpeg binary path
if (!ffmpegStatic) {
  throw new Error('ffmpeg-static binary not found');
}

const FFMPEG_PATH = ffmpegStatic;

/**
 * Custom error classes for FFmpeg operations
 */
export class FFmpegError extends Error {
  constructor(
    message: string,
    public type:
      | 'validation'
      | 'timeout'
      | 'codec'
      | 'filesystem'
      | 'memory'
      | 'unknown',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FFmpegError';
  }
}

/**
 * Timeout configuration by operation type
 */
const TIMEOUTS = {
  image_scale: 30000, // 30s - single image processing
  thumbnail: 15000, // 15s - thumbnail generation
  overlay: 45000, // 45s - overlay composition (works for image/gif/video)
  gif_small: 45000, // 45s - GIF with <5 frames
  gif_large: 90000, // 90s - GIF with 5-10 frames
  mp4_short: 60000, // 60s - MP4 with <10 frames
  mp4_long: 120000, // 120s - MP4 with 10-20 frames
};

/**
 * Categorize FFmpeg errors based on stderr output
 */
function categorizeFFmpegError(stderr: string): FFmpegError['type'] {
  const stderrLower = stderr.toLowerCase();

  if (
    stderrLower.includes('invalid data') ||
    stderrLower.includes('no such file') ||
    stderrLower.includes('does not exist')
  ) {
    return 'validation';
  }

  if (
    stderrLower.includes('unknown encoder') ||
    stderrLower.includes('encoder not found') ||
    stderrLower.includes('codec not currently supported')
  ) {
    return 'codec';
  }

  if (
    stderrLower.includes('permission denied') ||
    stderrLower.includes('no space left') ||
    stderrLower.includes('read only')
  ) {
    return 'filesystem';
  }

  if (
    stderrLower.includes('cannot allocate memory') ||
    stderrLower.includes('out of memory')
  ) {
    return 'memory';
  }

  return 'unknown';
}

/**
 * Run FFmpeg command with timeout and error handling
 */
function runFFmpegCommand(
  args: string[],
  options: {
    timeout?: number;
    description?: string;
  } = {}
): Promise<void> {
  const { timeout = 60000, description = 'FFmpeg operation' } = options;

  return new Promise((resolve, reject) => {
    let timeoutHandle: NodeJS.Timeout | null = null;
    let stderr = '';
    let stdout = '';

    console.log(`FFmpeg command: ${FFMPEG_PATH} ${args.join(' ')}`);

    const process = spawn(FFMPEG_PATH, args);

    if (timeout > 0) {
      timeoutHandle = setTimeout(() => {
        process.kill('SIGKILL');
        reject(
          new FFmpegError(`${description} timed out after ${timeout}ms`, 'timeout', {
            timeout,
            stderr,
          })
        );
      }, timeout);
    }

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('error', (err) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      reject(
        new FFmpegError(`${description} failed: ${err.message}`, 'unknown', {
          originalError: err,
          stderr,
        })
      );
    });

    process.on('close', (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (code === 0) {
        console.log(`${description} completed successfully`);
        resolve();
        return
      }

      const errorType = categorizeFFmpegError(stderr);
      reject(
        new FFmpegError(
          `${description} failed with exit code ${code}`,
          errorType,
          {
            exitCode: code,
            stderr,
            stdout,
          }
        )
      );

    });
  });
}

/**
 * Validate input file exists and is not empty
 */
async function validateInputFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);

    if (stats.size === 0) {
      throw new FFmpegError('Input file is empty', 'validation', {
        filePath,
        size: 0,
      });
    }

    if (stats.size > 50 * 1024 * 1024) {
      throw new FFmpegError('Input file exceeds maximum size (50MB)', 'validation', {
        filePath,
        size: stats.size,
        maxSize: 50 * 1024 * 1024,
      });
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FFmpegError('Input file not found', 'validation', {
        filePath,
        error: (err as Error).message,
      });
    }
    throw err;
  }
}

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
    // Note: Last frame should NOT have duration (or will add extra delay)
    const frameDuration = 1 / fps; // e.g., 2 fps = 0.5s per frame
    const concatLines: string[] = [];

    for (let i = 0; i < framePaths.length; i++) {
      concatLines.push(`file '${framePaths[i]}'`);
      // Add duration for all frames except the last one
      if (i < framePaths.length - 1) {
        concatLines.push(`duration ${frameDuration}`);
      }
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
    '-filter_complex', '[0:v][1:v]overlay=0:0',
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
