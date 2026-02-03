import {
  downloadFromStorage,
  parseStorageUrl,
  getStoragePathFromMediaReference,
} from '../../infra/storage';
import type { InputAsset, MediaReference } from '@clementine/shared';

/**
 * Download a single input asset from storage to local directory
 *
 * @param asset - Input asset from Firestore
 * @param tmpDir - Temporary directory path
 * @param filename - Filename to save as (e.g., 'input.jpg', 'frame-001.jpg')
 * @returns Full path to downloaded file
 */
export async function downloadSingleFrame(
  asset: InputAsset,
  tmpDir: string,
  filename: string
): Promise<string> {
  const outputPath = `${tmpDir}/${filename}`;
  const storagePath = parseStorageUrl(asset.url);
  await downloadFromStorage(storagePath, outputPath);
  return outputPath;
}

/**
 * Download session input assets to local temporary directory
 *
 * @param inputAssets - Session input assets from Firestore
 * @param tmpDir - Temporary directory path
 * @returns Array of downloaded frame paths
 */
export async function downloadSessionFrames(
  inputAssets: InputAsset[],
  tmpDir: string
): Promise<string[]> {
  const framePaths: string[] = [];

  for (let i = 0; i < inputAssets.length; i++) {
    const asset = inputAssets[i];
    if (!asset) continue;

    const filename = `frame-${String(i + 1).padStart(3, '0')}.jpg`;
    const framePath = await downloadSingleFrame(asset, tmpDir, filename);
    framePaths.push(framePath);
  }

  return framePaths;
}

/**
 * Download overlay image from Storage to local temporary directory
 *
 * Uses hardcoded overlay paths based on aspect ratio:
 * - square: media/company-test-001/overlays/square-overlay.png
 * - story: media/company-test-001/overlays/story-overlay.png
 *
 * @param aspectRatio - Target aspect ratio
 * @param tmpDir - Temporary directory path
 * @returns Full path to downloaded overlay file
 */
export async function downloadOverlay(
  aspectRatio: 'square' | 'story',
  tmpDir: string
): Promise<string> {
  // Hardcoded overlay paths for testing with emulator
  const COMPANY_ID = 'company-test-001';
  const overlayFilename = aspectRatio === 'square'
    ? 'square-overlay.png'
    : 'story-overlay.png';

  const storagePath = `media/${COMPANY_ID}/overlays/${overlayFilename}`;
  const outputPath = `${tmpDir}/overlay.png`;

  console.log(`[downloadOverlay] Aspect ratio: ${aspectRatio}`);
  console.log(`[downloadOverlay] Storage path: ${storagePath}`);
  console.log(`[downloadOverlay] Output path: ${outputPath}`);

  await downloadFromStorage(storagePath, outputPath);

  console.log(`[downloadOverlay] Successfully downloaded overlay`);
  return outputPath;
}

/**
 * Download overlay from MediaReference to local temporary directory
 *
 * Uses filePath if available (new documents), otherwise falls back
 * to parsing the URL (legacy documents without filePath).
 *
 * @param overlay - MediaReference to the overlay image
 * @param tmpDir - Temporary directory path
 * @returns Full path to downloaded overlay file
 */
export async function downloadOverlayFromReference(
  overlay: MediaReference,
  tmpDir: string
): Promise<string> {
  const storagePath = getStoragePathFromMediaReference(overlay);
  const outputPath = `${tmpDir}/overlay.png`;

  console.log(`[downloadOverlayFromReference] Overlay: ${overlay.displayName}`);
  console.log(`[downloadOverlayFromReference] Storage path: ${storagePath}`);
  console.log(`[downloadOverlayFromReference] Output path: ${outputPath}`);

  await downloadFromStorage(storagePath, outputPath);

  console.log(`[downloadOverlayFromReference] Successfully downloaded overlay`);
  return outputPath;
}
