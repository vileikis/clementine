import { z } from 'zod';

/**
 * Request schema for processMedia Cloud Function
 * Validates incoming requests to start media processing
 */
export const processMediaRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  outputFormat: z.enum(['image', 'gif', 'video']),
  aspectRatio: z.enum(['square', 'story']),
});

export type ProcessMediaRequest = z.infer<typeof processMediaRequestSchema>;

/**
 * Processing state stored in session.processing field during active processing
 */
export const processingStateSchema = z.object({
  state: z.enum(['pending', 'running', 'failed']),
  currentStep: z.string().optional(),
  startedAt: z.date(),
  updatedAt: z.date(),
  attemptNumber: z.number().int().min(1).max(3),
  taskId: z.string().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      timestamp: z.date(),
    })
    .optional(),
});

export type ProcessingState = z.infer<typeof processingStateSchema>;

/**
 * Session outputs stored in session.outputs field after successful processing
 */
export const sessionOutputsSchema = z.object({
  primaryUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  format: z.enum(['image', 'gif', 'video']),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  sizeBytes: z.number().int().positive(),
  completedAt: z.date(),
  processingTimeMs: z.number().int().nonnegative(),
});

export type SessionOutputs = z.infer<typeof sessionOutputsSchema>;

/**
 * Pipeline configuration derived from request parameters
 */
export const pipelineConfigSchema = z.object({
  outputFormat: z.enum(['image', 'gif', 'video']),
  aspectRatio: z.enum(['square', 'story']),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  frameDuration: z.number().positive(), // seconds per frame for GIF
  fps: z.number().int().positive(), // frames per second for video
});

export type PipelineConfig = z.infer<typeof pipelineConfigSchema>;

/**
 * Input asset from session document
 */
export const inputAssetSchema = z.object({
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  uploadedAt: z.date(),
});

export type InputAsset = z.infer<typeof inputAssetSchema>;
