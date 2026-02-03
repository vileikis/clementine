/**
 * Overlay Module
 *
 * Handles overlay application for transform pipeline outputs.
 * Self-contained module with its own logging and error handling.
 */
import { logger } from 'firebase-functions/v2'
import type { ProjectContextSnapshot } from '@clementine/shared'
import { downloadFromStorage, getStoragePathFromMediaReference } from '../../infra/storage'
import { applyOverlayToMedia } from '../media-pipeline/ffmpeg'

/**
 * Apply overlay to output if configured
 *
 * Checks if overlay is configured in project context, downloads the overlay,
 * and applies it to the input. Returns the input path unchanged if no overlay.
 *
 * @param inputPath - Path to input media file
 * @param projectContext - Project context from job snapshot
 * @param tmpDir - Temporary directory for intermediate files
 * @returns Path to output (overlayed or original input)
 */
export async function applyOverlayIfConfigured(
  inputPath: string,
  projectContext: ProjectContextSnapshot,
  tmpDir: string
): Promise<string> {
  // Check if overlay is configured
  if (!projectContext.applyOverlay || !projectContext.overlay) {
    logger.info('[Overlay] Skipping - not configured')
    return inputPath
  }

  const { overlay } = projectContext

  logger.info('[Overlay] Applying overlay', {
    displayName: overlay.displayName,
    mediaAssetId: overlay.mediaAssetId,
  })

  // Download overlay from storage
  const overlayPath = `${tmpDir}/overlay.png`
  const storagePath = getStoragePathFromMediaReference(overlay)

  logger.info('[Overlay] Downloading overlay', { storagePath })
  await downloadFromStorage(storagePath, overlayPath)

  // Apply overlay using FFmpeg
  const outputPath = `${tmpDir}/output-with-overlay.png`

  logger.info('[Overlay] Compositing overlay onto output')
  await applyOverlayToMedia(inputPath, overlayPath, outputPath)

  logger.info('[Overlay] Overlay applied successfully', { outputPath })

  return outputPath
}
