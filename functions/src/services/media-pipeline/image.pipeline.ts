import * as fs from 'fs/promises';
import { scaleAndCropImage, generateThumbnail, applyOverlayToMedia } from './ffmpeg';
import {
  uploadToStorage,
  getOutputStoragePath,
} from '../../lib/storage';
import { updateProcessingStep, markSessionFailed } from '../../lib/session';
import { getPipelineConfig } from './config';
import { createTempDir } from '../../lib/utils';
import { downloadSingleFrame, downloadOverlay } from './pipeline-utils';
import { applyAiTransform, mapAiTransformError } from './ai-transform-step';
import { mapAspectRatioToGemini } from './aspect-ratio-utils';
import { MOCKED_AI_CONFIG } from '../ai';
import type {
  SessionOutputs,
  SessionWithProcessing,
} from '@clementine/shared';
import type { PipelineOptions } from '../../lib/schemas/media-pipeline.schema';
import type { AiTransformConfig } from '../ai/providers/types';

/**
 * Process single image (User Story 1)
 *
 * @param session - Session document (already fetched)
 * @param options - Pipeline options (aspectRatio, overlay, aiTransform)
 */
export async function processSingleImage(
  session: SessionWithProcessing,
  options: PipelineOptions
): Promise<SessionOutputs> {
  const startTime = Date.now();

  // Validate inputs
  if (!session.inputAssets || session.inputAssets.length === 0) {
    throw new Error('No input assets found');
  }

  // Get pipeline config
  const config = getPipelineConfig('image', options.aspectRatio);

  // Create temp directory for processing
  const tmpDirObj = await createTempDir();

  try {
    await updateProcessingStep(session.id, 'downloading');

    // Download first input asset
    const inputAsset = session.inputAssets[0];
    if (!inputAsset) {
      throw new Error('No input asset found');
    }
    let inputPath = await downloadSingleFrame(inputAsset, tmpDirObj.path, 'input.jpg');

    // Apply AI transformation if requested
    if (options.aiTransform) {
      try {
        // Update session state to 'ai-transform'
        await updateProcessingStep(session.id, 'ai-transform');

        // Enrich AI config with pipeline's aspectRatio
        const enrichedConfig: AiTransformConfig = {
          ...MOCKED_AI_CONFIG,
          aspectRatio: mapAspectRatioToGemini(options.aspectRatio),
        };

        // Apply AI transformation
        inputPath = await applyAiTransform(inputPath, tmpDirObj.path, enrichedConfig);
      } catch (error) {
        // Map error to session error codes
        const { errorCode, errorMessage } = mapAiTransformError(error);

        // Mark session as failed
        await markSessionFailed(session.id, errorCode, errorMessage);

        // Re-throw to trigger Cloud Tasks retry
        throw error;
      }
    }

    await updateProcessingStep(session.id, 'processing');

    // Scale and crop image
    const scaledPath = `${tmpDirObj.path}/scaled.jpg`;
    await scaleAndCropImage(
      inputPath,
      scaledPath,
      config.outputWidth,
      config.outputHeight
    );

    // Apply overlay if requested
    let finalPath = scaledPath;
    if (options.overlay) {
      const overlayPath = await downloadOverlay(options.aspectRatio, tmpDirObj.path);
      const overlayedPath = `${tmpDirObj.path}/final.jpg`;
      await applyOverlayToMedia(scaledPath, overlayPath, overlayedPath);
      finalPath = overlayedPath;
    }

    // Generate thumbnail from final result (includes scaling, cropping, and overlay if applied)
    const thumbPath = `${tmpDirObj.path}/thumb.jpg`;
    await generateThumbnail(finalPath, thumbPath, 300);

    await updateProcessingStep(session.id, 'uploading');

    // Upload outputs to Storage
    const outputStoragePath = getOutputStoragePath(
      session.projectId,
      session.id,
      'output',
      'jpg'
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
      format: 'image',
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
