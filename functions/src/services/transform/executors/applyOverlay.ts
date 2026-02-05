/**
 * Overlay Application Executor
 *
 * Atomic executor for applying overlay images to media.
 * Downloads overlay from storage and composites it onto the input media.
 *
 * Refactored from the deprecated overlay.ts module.
 */
import { logger } from 'firebase-functions/v2'
import type { MediaReference, OverlaysConfig } from '@clementine/shared'
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
  const outputPath = `${tmpDir}/output-with-overlay.png`

  logger.info('[Overlay] Compositing overlay onto output')
  await applyOverlayToMedia(inputPath, overlayPath, outputPath)

  logger.info('[Overlay] Overlay applied successfully', { outputPath })

  return outputPath
}

/**
 * Get overlay reference for a specific aspect ratio
 *
 * Looks up the overlay from the overlays config by aspect ratio.
 * Returns null if no overlay is configured for the aspect ratio.
 *
 * @param overlays - Overlays config from project context
 * @param aspectRatio - Target aspect ratio (e.g., '1:1', '9:16')
 * @returns MediaReference for the overlay, or null if not configured
 */
export function getOverlayForAspectRatio(
  overlays: OverlaysConfig | null | undefined,
  aspectRatio: string,
): MediaReference | null {
  if (!overlays) {
    return null
  }

  // Type assertion because OverlaysConfig is a record with known keys
  const overlayRef = (overlays as Record<string, MediaReference | null>)[aspectRatio]

  return overlayRef ?? null
}
