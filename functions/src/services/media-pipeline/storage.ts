import { storage } from '../../lib/firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Download a file from Firebase Storage to local filesystem
 *
 * @param storagePath - Storage path (e.g., "projects/abc/inputs/photo.jpg")
 * @param localPath - Local filesystem path to save file
 * @returns Promise that resolves when download completes
 */
export async function downloadFromStorage(
  storagePath: string,
  localPath: string
): Promise<void> {
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  await file.download({ destination: localPath });

  // Verify file was downloaded and is not empty
  const stats = await fs.stat(localPath);
  if (stats.size === 0) {
    throw new Error(`Downloaded file is empty: ${storagePath}`);
  }
}

/**
 * Upload a file from local filesystem to Firebase Storage with public access
 *
 * @param localPath - Local filesystem path to upload
 * @param storagePath - Storage destination path
 * @returns Public URL to access the uploaded file
 */
export async function uploadToStorage(
  localPath: string,
  storagePath: string
): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  // Verify file exists and is not empty before uploading
  const stats = await fs.stat(localPath);
  if (stats.size === 0) {
    throw new Error(`Cannot upload empty file: ${localPath}`);
  }

  // Upload file
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
  });

  // Make file publicly accessible
  await file.makePublic();

  // Return public URL
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

/**
 * Generate storage path for output media
 *
 * @param projectId - Project ID
 * @param sessionId - Session ID
 * @param type - Output type (output or thumb)
 * @param extension - File extension (jpg, gif, mp4)
 * @returns Storage path
 */
export function getOutputStoragePath(
  projectId: string,
  sessionId: string,
  type: 'output' | 'thumb',
  extension: string
): string {
  return `projects/${projectId}/results/${sessionId}-${type}.${extension}`;
}

/**
 * Parse storage URL to extract storage path
 *
 * @param storageUrl - Full storage URL
 * @returns Storage path without bucket name
 */
export function parseStorageUrl(storageUrl: string): string {
  // Handle both gs:// and https:// URLs
  if (storageUrl.startsWith('gs://')) {
    // gs://bucket-name/path/to/file.jpg → path/to/file.jpg
    const parts = storageUrl.replace('gs://', '').split('/');
    return parts.slice(1).join('/');
  } else if (storageUrl.includes('storage.googleapis.com')) {
    // https://storage.googleapis.com/bucket-name/path/to/file.jpg → path/to/file.jpg
    const urlParts = storageUrl.split('storage.googleapis.com/');
    if (urlParts[1]) {
      const parts = urlParts[1].split('/');
      return parts.slice(1).join('/');
    }
  }

  // Assume it's already a storage path
  return storageUrl;
}
