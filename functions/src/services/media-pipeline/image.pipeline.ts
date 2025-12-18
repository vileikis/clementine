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
import { transformImage, MOCKED_AI_CONFIG } from '../ai';
import { AiTransformError } from '../ai/providers/types';
import type {
  SessionOutputs,
  SessionWithProcessing,
} from '@clementine/shared';
import type { PipelineOptions } from '../../lib/schemas/media-pipeline.schema';

/**
 * Process single image (User Story 1)
 *
 * @param session - Session document (already fetched)
 * @param options - Pipeline options (aspectRatio, overlay)
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
        await updateProcessingStep(session.id, 'ai-transform');

        // Read input image as buffer
        const inputBuffer = await fs.readFile(inputPath);

        // Get API key from environment (Firebase Params will populate this)
        const apiKey = process.env.GOOGLE_AI_API_KEY || '';
        if (!apiKey) {
          throw new AiTransformError(
            'GOOGLE_AI_API_KEY environment variable not set',
            'INVALID_CONFIG'
          );
        }

        // Transform image using AI service
        const transformedBuffer = await transformImage(inputBuffer, MOCKED_AI_CONFIG, apiKey);

        // Write transformed buffer to new file
        const transformedPath = `${tmpDirObj.path}/transformed.jpg`;
        await fs.writeFile(transformedPath, transformedBuffer);

        // Use transformed image for subsequent pipeline steps
        inputPath = transformedPath;
      } catch (error) {
        // Handle AI transformation errors
        let errorCode = 'AI_TRANSFORM_FAILED';
        let errorMessage = 'AI transformation failed';

        if (error instanceof AiTransformError) {
          // Map specific AI error codes to session error codes
          switch (error.code) {
            case 'REFERENCE_IMAGE_NOT_FOUND':
              errorCode = 'REFERENCE_IMAGE_NOT_FOUND';
              errorMessage = `Reference image not found: ${error.message}`;
              break;
            case 'INVALID_CONFIG':
              errorCode = 'AI_CONFIG_INVALID';
              errorMessage = `Invalid AI config: ${error.message}`;
              break;
            case 'API_ERROR':
            case 'INVALID_INPUT_IMAGE':
            case 'TIMEOUT':
            default:
              errorCode = 'AI_TRANSFORM_FAILED';
              errorMessage = `AI transformation failed: ${error.message}`;
              break;
          }
        } else if (error instanceof Error) {
          errorMessage = `AI transformation failed: ${error.message}`;
        }

        // Mark session as failed
        await markSessionFailed(session.id, errorCode, errorMessage);

        // Re-throw error to trigger Cloud Tasks retry
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
