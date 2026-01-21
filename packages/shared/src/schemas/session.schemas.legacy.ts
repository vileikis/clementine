import { z } from "zod"

/**
 * Represents a single input file (image or video) submitted by a guest for processing.
 */
export const inputAssetSchema = z.object({
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  uploadedAt: z.number().int().positive(),
})

export type InputAsset = z.infer<typeof inputAssetSchema>

/**
 * Captures error details when media processing fails.
 */
export const processingErrorSchema = z.object({
  message: z.string().min(1),
  code: z.string().min(1),
  step: z.string().min(1),
  isRetryable: z.boolean(),
  timestamp: z.number().int().positive(),
})

export type ProcessingError = z.infer<typeof processingErrorSchema>

/**
 * Tracks the current state of media processing for a session.
 */
export const processingStateSchema = z.object({
  state: z.enum(["pending", "running", "completed", "failed"]),
  currentStep: z.string().min(1),
  startedAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  attemptNumber: z.number().int().min(1),
  taskId: z.string().min(1),
  error: processingErrorSchema.optional(),
})

export type ProcessingState = z.infer<typeof processingStateSchema>

/**
 * Represents the final processed media output from a completed session.
 */
export const sessionOutputsSchema = z.object({
  primaryUrl: z.url(),
  thumbnailUrl: z.url(),
  format: z.enum(["gif", "mp4", "webm", "image"]),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  sizeBytes: z.number().int().positive(),
  completedAt: z.number().int().positive(),
  processingTimeMs: z.number().int().nonnegative(),
})

export type SessionOutputs = z.infer<typeof sessionOutputsSchema>

/**
 * Processing-specific fields to extend the base Session from guest.schemas.ts.
 * These fields are added when a session enters the processing pipeline.
 */
export const sessionProcessingSchema = z.object({
  inputAssets: z.array(inputAssetSchema).min(1),
  processing: processingStateSchema.optional(),
  outputs: sessionOutputsSchema.optional(),
})

export type SessionProcessing = z.infer<typeof sessionProcessingSchema>

/**
 * Complete session schema with all fields for media processing pipeline
 */
export const sessionWithProcessingSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  companyId: z.string().min(1),
  guestId: z.string().min(1),
  experienceId: z.string().min(1),
  inputAssets: z.array(inputAssetSchema).optional(),
  processing: processingStateSchema.optional(),
  outputs: sessionOutputsSchema.optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export type SessionWithProcessing = z.infer<typeof sessionWithProcessingSchema>

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
})

export type PipelineConfig = z.infer<typeof pipelineConfigSchema>
