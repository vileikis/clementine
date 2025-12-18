import * as fs from 'fs/promises';
import { createGIF, generateThumbnail } from './ffmpeg';
import {
  uploadToStorage,
  getOutputStoragePath,
} from '../../lib/storage';
import { updateProcessingStep } from '../../lib/session';
import { getPipelineConfig } from './config';
import { createTempDir } from '../../lib/utils';
import { downloadSessionFrames } from './pipeline-utils';
import type {
  SessionOutputs,
  SessionWithProcessing,
} from '@clementine/shared';

/**
 * Process multi-frame GIF (User Story 2)
 *
 * @param session - Session document (already fetched)
 * @param aspectRatio - Target aspect ratio
 */
export async function processGIF(
  session: SessionWithProcessing,
  aspectRatio: 'square' | 'story'
): Promise<SessionOutputs> {
  const startTime = Date.now();

  // Validate inputs
  if (!session.inputAssets || session.inputAssets.length < 2) {
    throw new Error('GIF requires at least 2 input frames');
  }

  // Get pipeline config
  const config = getPipelineConfig('gif', aspectRatio);

  // Create temp directory for processing
  const tmpDirObj = await createTempDir();

  try {
    await updateProcessingStep(session.id, 'downloading');

    // Download unique frames
    const downloadedFrames = await downloadSessionFrames(
      session.inputAssets,
      tmpDirObj.path
    );

    await updateProcessingStep(session.id, 'processing');

    // Create boomerang sequence: [1,2,3,4] + [3,2,1] = [1,2,3,4,3,2,1]
    // No file duplication - just reference the same files multiple times
    const boomerangFrames = [
      ...downloadedFrames,
      ...downloadedFrames.slice(0, -1).reverse(),
    ];

    // Create GIF
    const gifPath = `${tmpDirObj.path}/output.gif`;
    await createGIF(boomerangFrames, gifPath, config.outputWidth);

    // Generate thumbnail from first frame
    const thumbPath = `${tmpDirObj.path}/thumb.jpg`;
    const firstFrame = downloadedFrames[0];
    if (!firstFrame) {
      throw new Error('No frames available for thumbnail');
    }
    await generateThumbnail(firstFrame, thumbPath, 300);

    await updateProcessingStep(session.id, 'uploading');

    // Upload outputs to Storage
    const outputStoragePath = getOutputStoragePath(
      session.projectId,
      session.id,
      'output',
      'gif'
    );
    const thumbStoragePath = getOutputStoragePath(
      session.projectId,
      session.id,
      'thumb',
      'jpg'
    );

    const [primaryUrl, thumbnailUrl] = await Promise.all([
      uploadToStorage(gifPath, outputStoragePath),
      uploadToStorage(thumbPath, thumbStoragePath),
    ]);

    // Get file size
    const gifStats = await fs.stat(gifPath);

    // Create outputs object
    const outputs: SessionOutputs = {
      primaryUrl,
      thumbnailUrl,
      format: 'gif',
      dimensions: {
        width: config.outputWidth,
        height: config.outputHeight,
      },
      sizeBytes: gifStats.size,
      completedAt: Date.now(),
      processingTimeMs: Date.now() - startTime,
    };

    return outputs;
  } finally {
    // Cleanup temp directory
    tmpDirObj.cleanup();
  }
}
