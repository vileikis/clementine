/**
 * Overlay Application Executor
 *
 * Atomic executor for applying overlay images to media.
 * Downloads overlay from storage and composites it onto the input media.
 *
 * Feature 065: Simplified module
 * - Overlay resolution now happens at job creation in startTransformPipeline.ts
 * - This module only handles the actual overlay application
 * - Removed getOverlayForAspectRatio helper (no longer needed)
 */
import { logger } from 'firebase-functions/v2'
import type { MediaReference } from '@clementine/shared'
import { downloadFromStorage, getStoragePathFromMediaReference } from '../../../infra/storage'
import { applyOverlayToMedia } from '../../ffmpeg'

/**
 * Apply overlay to media file
 *
 * Downloads the overlay from storage and applies it to the input media.
 * Returns the input path unchanged if no overlay is configured.
 *
 * @param inputPath - Path to input media file
 * @param overlay - MediaReference for the overlay image
 * @param tmpDir - Temporary directory for intermediate files
 * @returns Path to output (overlayed or original input)
 */
export async function applyOverlay(
  inputPath: string,
  overlay: MediaReference,
  tmpDir: string,
): Promise<string> {
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
  const outputPath = `${tmpDir}/output-with-overlay.jpg`

  logger.info('[Overlay] Compositing overlay onto output')
  await applyOverlayToMedia(inputPath, overlayPath, outputPath)

  logger.info('[Overlay] Overlay applied successfully', { outputPath })

  return outputPath
}
