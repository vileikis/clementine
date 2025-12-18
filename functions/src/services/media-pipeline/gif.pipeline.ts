import * as fs from 'fs/promises';
import { createGIF, generateThumbnail, applyOverlayToMedia, scaleAndCropGIF } from './ffmpeg';
import {
  uploadToStorage,
  getOutputStoragePath,
} from '../../lib/storage';
import { updateProcessingStep } from '../../lib/session';
import { getPipelineConfig } from './config';
import { createTempDir } from '../../lib/utils';
import { downloadSessionFrames, downloadOverlay } from './pipeline-utils';
import type {
  SessionOutputs,
  SessionWithProcessing,
} from '@clementine/shared';
import type { PipelineOptions } from '../../lib/schemas/media-pipeline.schema';

/**
 * Process multi-frame GIF (User Story 2)
 *
 * @param session - Session document (already fetched)
 * @param options - Pipeline options (aspectRatio, overlay)
 */
export async function processGIF(
  session: SessionWithProcessing,
  options: PipelineOptions
): Promise<SessionOutputs> {
  const startTime = Date.now();

  // Validate inputs
  if (!session.inputAssets || session.inputAssets.length < 2) {
    throw new Error('GIF requires at least 2 input frames');
  }

  // Get pipeline config
  const config = getPipelineConfig('gif', options.aspectRatio);

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
      ...downloadedFrames.slice(1, -1).reverse(),
    ];

    // Create GIF (at original frame dimensions)
    const gifPath = `${tmpDirObj.path}/output.gif`;
    await createGIF(boomerangFrames, gifPath, config.outputWidth);

    // Scale and crop GIF to exact target dimensions
    console.log(`[GIF Pipeline] Scaling and cropping GIF to ${config.outputWidth}x${config.outputHeight}`);
    const scaledGifPath = `${tmpDirObj.path}/scaled.gif`;
    await scaleAndCropGIF(
      gifPath,
      scaledGifPath,
      config.outputWidth,
      config.outputHeight
    );

    // Apply overlay if requested
    let finalPath = scaledGifPath;
    if (options.overlay) {
      console.log(`[GIF Pipeline] Applying overlay for aspect ratio: ${options.aspectRatio}`);
      const overlayPath = await downloadOverlay(options.aspectRatio, tmpDirObj.path);
      console.log(`[GIF Pipeline] Overlay downloaded to: ${overlayPath}`);
      const overlayedPath = `${tmpDirObj.path}/final.gif`;
      console.log(`[GIF Pipeline] Compositing GIF with overlay...`);
      await applyOverlayToMedia(scaledGifPath, overlayPath, overlayedPath);
      console.log(`[GIF Pipeline] Overlay applied successfully to: ${overlayedPath}`);
      finalPath = overlayedPath;
    }

    // Generate thumbnail from final GIF (includes scaling, cropping, and overlay if applied)
    const thumbPath = `${tmpDirObj.path}/thumb.jpg`;
    await generateThumbnail(finalPath, thumbPath, 300);

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
      uploadToStorage(finalPath, outputStoragePath),
      uploadToStorage(thumbPath, thumbStoragePath),
    ]);

    // Get file size
    const finalStats = await fs.stat(finalPath);

    // Create outputs object
    const outputs: SessionOutputs = {
      primaryUrl,
      thumbnailUrl,
      format: 'gif',
      dimensions: {
        width: config.outputWidth,
        height: config.outputHeight,
      },
      sizeBytes: finalStats.size,
      completedAt: Date.now(),
      processingTimeMs: Date.now() - startTime,
    };

    return outputs;
  } finally {
    // Cleanup temp directory
    tmpDirObj.cleanup();
  }
}
