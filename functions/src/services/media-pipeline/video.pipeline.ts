import * as fs from 'fs/promises';
import { createMP4, generateThumbnail } from './ffmpeg';
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
 * Process multi-frame video (User Story 3)
 *
 * @param sessionId - Session ID
 * @param aspectRatio - Target aspect ratio
 */
export async function processVideo(
  sessionId: string,
  aspectRatio: 'square' | 'story'
): Promise<SessionOutputs> {
  const startTime = Date.now();

  // Fetch session
  const session = await fetchSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Validate inputs
  if (!session.inputAssets || session.inputAssets.length < 2) {
    throw new Error('Video requires at least 2 input frames');
  }

  // Get pipeline config
  const config = getPipelineConfig('video', aspectRatio);

  // Create temp directory for processing
  const tmpDirObj = await createTempDir();

  try {
    await updateProcessingStep(sessionId, 'downloading');

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

    await updateProcessingStep(sessionId, 'processing');

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

    await updateProcessingStep(sessionId, 'uploading');

    // Upload outputs to Storage
    const outputStoragePath = getOutputStoragePath(
      session.projectId,
      sessionId,
      'output',
      'mp4'
    );
    const thumbStoragePath = getOutputStoragePath(
      session.projectId,
      sessionId,
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
