import * as fs from 'fs/promises';
import { scaleAndCropImage, generateThumbnail } from './ffmpeg';
import {
  downloadFromStorage,
  uploadToStorage,
  getOutputStoragePath,
  parseStorageUrl,
} from '../../lib/storage';
import {
  fetchSession,
  updateProcessingStep,
} from '../../lib/session';
import { getPipelineConfig } from './config';
import { createTempDir } from '../../lib/utils';
import type { SessionOutputs } from '@clementine/shared';

/**
 * Process single image (User Story 1)
 *
 * @param sessionId - Session ID
 * @param outputFormat - Requested output format
 * @param aspectRatio - Target aspect ratio
 */
export async function processSingleImage(
  sessionId: string,
  outputFormat: 'image' | 'gif' | 'video',
  aspectRatio: 'square' | 'story'
): Promise<SessionOutputs> {
  const startTime = Date.now();

  // Fetch session
  const session = await fetchSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Validate inputs
  if (!session.inputAssets || session.inputAssets.length === 0) {
    throw new Error('No input assets found');
  }

  // Get pipeline config
  const config = getPipelineConfig(outputFormat, aspectRatio);

  // Create temp directory for processing
  const tmpDirObj = await createTempDir();

  try {
    await updateProcessingStep(sessionId, 'downloading');

    // Download first input asset
    const inputAsset = session.inputAssets[0];
    if (!inputAsset) {
      throw new Error('No input asset found');
    }
    const inputPath = `${tmpDirObj.path}/input.jpg`;
    const storagePath = parseStorageUrl(inputAsset.url);
    await downloadFromStorage(storagePath, inputPath);

    await updateProcessingStep(sessionId, 'processing');

    // Scale and crop image
    const scaledPath = `${tmpDirObj.path}/scaled.jpg`;
    await scaleAndCropImage(
      inputPath,
      scaledPath,
      config.outputWidth,
      config.outputHeight
    );

    // Generate thumbnail
    const thumbPath = `${tmpDirObj.path}/thumb.jpg`;
    await generateThumbnail(inputPath, thumbPath, 300);

    await updateProcessingStep(sessionId, 'uploading');

    // Upload outputs to Storage
    const outputStoragePath = getOutputStoragePath(
      session.projectId,
      sessionId,
      'output',
      'jpg'
    );
    const thumbStoragePath = getOutputStoragePath(
      session.projectId,
      sessionId,
      'thumb',
      'jpg'
    );

    const [primaryUrl, thumbnailUrl] = await Promise.all([
      uploadToStorage(scaledPath, outputStoragePath),
      uploadToStorage(thumbPath, thumbStoragePath),
    ]);

    // Get file size
    const scaledStats = await fs.stat(scaledPath);

    // Create outputs object
    const outputs: SessionOutputs = {
      primaryUrl,
      thumbnailUrl,
      format: 'image',
      dimensions: {
        width: config.outputWidth,
        height: config.outputHeight,
      },
      sizeBytes: scaledStats.size,
      completedAt: Date.now(),
      processingTimeMs: Date.now() - startTime,
    };

    return outputs;
  } finally {
    // Cleanup temp directory
    tmpDirObj.cleanup();
  }
}
