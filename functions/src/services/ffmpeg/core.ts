import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import * as fs from 'fs/promises';

// Validate ffmpeg binary path
if (!ffmpegStatic) {
  throw new Error('ffmpeg-static binary not found');
}

export const FFMPEG_PATH = ffmpegStatic;

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
export const TIMEOUTS = {
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
export function categorizeFFmpegError(stderr: string): FFmpegError['type'] {
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
export function runFFmpegCommand(
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
export async function validateInputFile(filePath: string): Promise<void> {
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
