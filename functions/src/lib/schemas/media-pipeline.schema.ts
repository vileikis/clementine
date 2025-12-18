import { z } from 'zod';

/**
 * Media Pipeline Request Schemas
 *
 * This file contains only Cloud Function-specific request validation schemas.
 * All shared data model schemas (session, processing, outputs) are imported from @clementine/shared.
 */

// Re-export shared types for convenience
export type {
  InputAsset,
  ProcessingState,
  SessionOutputs,
  PipelineConfig,
  SessionWithProcessing,
} from '@clementine/shared';

/**
 * Request schema for processMedia Cloud Function endpoint
 * Validates incoming HTTP requests to start media processing
 */
export const processMediaRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  outputFormat: z.enum(['image', 'gif', 'video']),
  aspectRatio: z.enum(['square', 'story']),
  overlay: z.boolean().optional().default(false),
});

export type ProcessMediaRequest = z.infer<typeof processMediaRequestSchema>;

/**
 * Pipeline options passed to processing functions
 */
export const pipelineOptionsSchema = z.object({
  aspectRatio: z.enum(['square', 'story']),
  overlay: z.boolean().optional().default(false),
});

export type PipelineOptions = z.infer<typeof pipelineOptionsSchema>;
