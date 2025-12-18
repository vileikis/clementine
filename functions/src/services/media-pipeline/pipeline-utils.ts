import {
  downloadFromStorage,
  parseStorageUrl,
} from '../../lib/storage';
import type { InputAsset } from '@clementine/shared';

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
