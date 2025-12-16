import { onRequest } from 'firebase-functions/v2/https';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { processMediaRequestSchema } from '../lib/schemas/media-pipeline.schema';
import {
  fetchSession,
  isSessionProcessing,
  markSessionPending,
} from '../services/media-pipeline/session';

/**
 * HTTP Cloud Function endpoint to queue media processing jobs
 *
 * Validates request, checks session exists, and queues Cloud Task for async processing
 */
export const processMedia = onRequest(
  {
    region: 'europe-west1',
    cors: true,
  },
  async (req, res) => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Validate request body
      const parseResult = processMediaRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Invalid request',
          details: parseResult.error.errors,
        });
        return;
      }

      const { sessionId, outputFormat, aspectRatio } = parseResult.data;

      // Fetch session from Firestore
      const session = await fetchSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Check if already processing
      if (isSessionProcessing(session)) {
        res.status(409).json({ error: 'Session is already being processed' });
        return;
      }

      // Validate session has input assets
      if (!session.inputAssets || session.inputAssets.length === 0) {
        res.status(400).json({ error: 'Session has no input assets' });
        return;
      }

      // Mark session as pending
      await markSessionPending(sessionId, 1);

      // Queue Cloud Task for async processing
      // NOTE: Cloud Tasks integration will be implemented in T010
      // For now, return success response
      res.status(200).json({
        success: true,
        message: 'Processing queued',
        sessionId,
        outputFormat,
        aspectRatio,
      });
    } catch (error) {
      console.error('Error in processMedia endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
