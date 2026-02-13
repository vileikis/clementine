import { z } from 'zod'

/**
 * Transform Pipeline Request/Response Schemas
 *
 * Validation schemas for the transform pipeline callable function.
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
 * Cloud Task payload schema for transformPipelineTask
 */
export const transformPipelineJobPayloadSchema = z.object({
  jobId: z.string().min(1),
  sessionId: z.string().min(1),
  projectId: z.string().min(1),
})

export type TransformPipelineJobPayload = z.infer<
  typeof transformPipelineJobPayloadSchema
>
