import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { processMediaRequestSchema } from '../lib/schemas/media-pipeline.schema';
import {
  fetchSession,
  markSessionRunning,
  markSessionFailed,
  updateSessionOutputs,
} from '../services/media-pipeline/session';
import {
  processSingleImage,
  processGIF,
  processVideo,
} from '../services/media-pipeline/pipeline';
import { detectOutputFormat } from '../services/media-pipeline/config';

/**
 * Cloud Task handler for async media processing
 *
 * Extracts payload, marks session as running, orchestrates pipeline, handles errors
 */
export const processMediaJob = onTaskDispatched(
  {
    region: 'europe-west1',
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 30,
    },
    rateLimits: {
      maxConcurrentDispatches: 10,
    },
  },
  async (req) => {
    try {
      // Extract payload from task
      const parseResult = processMediaRequestSchema.safeParse(req.data);
      if (!parseResult.success) {
        console.error('Invalid task payload:', parseResult.error.errors);
        throw new Error('Invalid task payload');
      }

      const { sessionId, outputFormat, aspectRatio } = parseResult.data;

      console.log(`Processing session ${sessionId}`, {
        outputFormat,
        aspectRatio,
      });

      // Fetch session
      const session = await fetchSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Mark session as running
      await markSessionRunning(sessionId, 'initializing');

      // Detect actual output format based on input count
      const actualFormat = detectOutputFormat(
        outputFormat,
        session.inputAssets?.length || 0
      );

      console.log(`Detected output format: ${actualFormat}`, {
        requestedFormat: outputFormat,
        inputCount: session.inputAssets?.length,
      });

      // Route to appropriate pipeline based on format
      let outputs;
      if (actualFormat === 'image') {
        outputs = await processSingleImage(sessionId, outputFormat, aspectRatio);
      } else if (actualFormat === 'gif') {
        outputs = await processGIF(sessionId, aspectRatio);
      } else if (actualFormat === 'video') {
        outputs = await processVideo(sessionId, aspectRatio);
      } else {
        throw new Error(`Unknown output format: ${actualFormat}`);
      }

      // Update session with outputs and cleanup processing state
      await updateSessionOutputs(sessionId, outputs);

      console.log(`Successfully processed session ${sessionId}`, {
        format: outputs.format,
        processingTimeMs: outputs.processingTimeMs,
        sizeBytes: outputs.sizeBytes,
      });
    } catch (error) {
      console.error('Error processing media:', error);

      // Extract sessionId from payload if possible
      const payload = req.data as { sessionId?: string };
      if (payload.sessionId) {
        await markSessionFailed(
          payload.sessionId,
          'PROCESSING_FAILED',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      // Re-throw to trigger Cloud Tasks retry
      throw error;
    }
  }
);
