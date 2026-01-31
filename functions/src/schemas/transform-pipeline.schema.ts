import { z } from 'zod'

/**
 * Transform Pipeline Request/Response Schemas
 *
 * HTTP endpoint validation schemas for the transform pipeline.
 * See contracts/start-transform-pipeline.yaml for full API specification.
 */

/**
 * Request schema for startTransformPipeline callable function
 */
export const startTransformPipelineRequestSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  sessionId: z.string().min(1, 'sessionId is required'),
})

export type StartTransformPipelineRequest = z.infer<
  typeof startTransformPipelineRequestSchema
>

/**
 * Success response schema for startTransformPipeline
 */
export const startTransformPipelineResponseSchema = z.object({
  success: z.literal(true),
  jobId: z.string(),
  message: z.string(),
})

export type StartTransformPipelineResponse = z.infer<
  typeof startTransformPipelineResponseSchema
>

/**
 * Error codes for startTransformPipeline endpoint
 */
export const transformPipelineErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'SESSION_NOT_FOUND',
  'TRANSFORM_NOT_FOUND',
  'JOB_IN_PROGRESS',
  'INTERNAL_ERROR',
])

export type TransformPipelineErrorCode = z.infer<
  typeof transformPipelineErrorCodeSchema
>

/**
 * Error response schema for startTransformPipeline
 */
export const transformPipelineErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: transformPipelineErrorCodeSchema,
    message: z.string(),
  }),
})

export type TransformPipelineErrorResponse = z.infer<
  typeof transformPipelineErrorResponseSchema
>

/**
 * Cloud Task payload schema for transformPipelineJob
 */
export const transformPipelineJobPayloadSchema = z.object({
  jobId: z.string().min(1),
  sessionId: z.string().min(1),
  projectId: z.string().min(1),
})

export type TransformPipelineJobPayload = z.infer<
  typeof transformPipelineJobPayloadSchema
>
