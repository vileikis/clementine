import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import * as fs from 'fs/promises';
import * as tmp from 'tmp';

// Validate ffmpeg binary path
if (!ffmpegStatic) {
  throw new Error('ffmpeg-static binary not found');
}

const FFMPEG_PATH = ffmpegStatic;

// Enable graceful cleanup
tmp.setGracefulCleanup();

/**
 * Create temp directory with cleanup callback
 */
async function createTempDir(): Promise<{ path: string; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true }, (err, path, cleanup) => {
      if (err) reject(err);
      else resolve({ path, cleanup });
    });
  });
}

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
 * Generate palette for GIF from image sequence
 */
async function generatePalette(
  framePattern: string,
  palettePath: string,
  width: number
): Promise<void> {
  const args = [
    '-pattern_type', 'glob',
    '-i', framePattern,
    '-vf', `fps=2,scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=256`,
    '-y', // Overwrite output file
    palettePath
  ];

  await runFFmpegCommand(args, {
    timeout: TIMEOUTS.gif_small,
    description: 'GIF palette generation',
  });
}

/**
 * Create GIF from image sequence using palette
 *
 * @param framePaths - Array of frame file paths
 * @param outputPath - Path to output GIF
 * @param width - Target width
 */
export async function createGIF(
  framePaths: string[],
  outputPath: string,
  width: number
): Promise<void> {
  // Validate all input frames
  await Promise.all(framePaths.map((path) => validateInputFile(path)));

  // Validate we have frames
  const firstFrame = framePaths[0];
  if (!firstFrame) {
    throw new FFmpegError('No frames provided for GIF', 'validation', {
      frameCount: framePaths.length,
    });
  }

  // Create temp directory for palette
  const tmpDirObj = await createTempDir();

  try {
    const frameDir = firstFrame.substring(0, firstFrame.lastIndexOf('/'));
    const framePattern = `${frameDir}/frame-*.jpg`;
    const palettePath = `${tmpDirObj.path}/palette.png`;

    // Generate palette
    await generatePalette(framePattern, palettePath, width);

    // Create GIF using palette
    const args = [
      '-pattern_type', 'glob',
      '-i', framePattern,
      '-i', palettePath,
      '-filter_complex', `fps=2,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
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
    // Cleanup temp directory
    tmpDirObj.cleanup();
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
