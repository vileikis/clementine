import * as fs from 'fs/promises';
import { createMP4, generateThumbnail } from './ffmpeg';
import {
  downloadFromStorage,
  uploadToStorage,
  getOutputStoragePath,
  parseStorageUrl,
} from '../../lib/storage';
import { updateProcessingStep } from '../../lib/session';
import { getPipelineConfig } from './config';
import { createTempDir } from '../../lib/utils';
import type {
  SessionOutputs,
  SessionWithProcessing,
} from '@clementine/shared';
import type { PipelineOptions } from '../../lib/schemas/media-pipeline.schema';

/**
 * Process multi-frame video (User Story 3)
 *
 * @param session - Session document (already fetched)
 * @param options - Pipeline options (aspectRatio, overlay)
 */
export async function processVideo(
  session: SessionWithProcessing,
  options: PipelineOptions
): Promise<SessionOutputs> {
  const startTime = Date.now();

  // Validate inputs
  if (!session.inputAssets || session.inputAssets.length < 2) {
    throw new Error('Video requires at least 2 input frames');
  }

  // Get pipeline config
  const config = getPipelineConfig('video', options.aspectRatio);

  // Create temp directory for processing
  const tmpDirObj = await createTempDir();

  try {
    await updateProcessingStep(session.id, 'downloading');

    // Download all frames
    const framePaths: string[] = [];
    for (let i = 0; i < session.inputAssets.length; i++) {
      const asset = session.inputAssets[i];
      if (!asset) continue;
      const framePath = `${tmpDirObj.path}/frame-${String(i + 1).padStart(3, '0')}.jpg`;
      const storagePath = parseStorageUrl(asset.url);
      await downloadFromStorage(storagePath, framePath);
      framePaths.push(framePath);
    }

    await updateProcessingStep(session.id, 'processing');

    // Create MP4
    const videoPath = `${tmpDirObj.path}/output.mp4`;
    await createMP4(framePaths, videoPath, config.outputWidth, config.outputHeight);

    // Generate thumbnail from first frame
    const thumbPath = `${tmpDirObj.path}/thumb.jpg`;
    const firstFrame = framePaths[0];
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
      'mp4'
    );
    const thumbStoragePath = getOutputStoragePath(
      session.projectId,
      session.id,
      'thumb',
      'jpg'
    );

    const [primaryUrl, thumbnailUrl] = await Promise.all([
      uploadToStorage(videoPath, outputStoragePath),
      uploadToStorage(thumbPath, thumbStoragePath),
    ]);

    // Get file size
    const videoStats = await fs.stat(videoPath);

    // Create outputs object
    const outputs: SessionOutputs = {
      primaryUrl,
      thumbnailUrl,
      format: 'mp4',
      dimensions: {
        width: config.outputWidth,
        height: config.outputHeight,
      },
      sizeBytes: videoStats.size,
      completedAt: Date.now(),
      processingTimeMs: Date.now() - startTime,
    };

    return outputs;
  } finally {
    // Cleanup temp directory
    tmpDirObj.cleanup();
  }
}
