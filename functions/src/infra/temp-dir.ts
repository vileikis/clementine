/**
 * Temporary Directory Utilities
 *
 * Manages local filesystem temporary directories for Cloud Function execution.
 * Used by tasks that need to process files locally (transforms, media processing).
 */
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs/promises'
import { logger } from 'firebase-functions/v2'

/**
 * Create a temporary directory for task execution
 *
 * @param taskId - Unique identifier for the task (e.g., jobId)
 * @param prefix - Optional prefix for the directory name (default: 'task')
 * @returns Path to the created temporary directory
 */
export async function createTempDir(
  taskId: string,
  prefix: string = 'task'
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `${prefix}-${taskId}`)
  await fs.mkdir(tmpDir, { recursive: true })
  return tmpDir
}

/**
 * Clean up a temporary directory
 *
 * Safely removes the directory and all contents.
 * Logs warnings on failure but doesn't throw.
 *
 * @param tmpDir - Path to temporary directory to remove
 */
export async function cleanupTempDir(tmpDir: string): Promise<void> {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true })
    logger.info('[TempDir] Cleaned up', { tmpDir })
  } catch (error) {
    logger.warn('[TempDir] Cleanup failed', {
      tmpDir,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
