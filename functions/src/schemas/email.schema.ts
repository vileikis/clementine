/**
 * Email Cloud Task & Callable Payload Schemas
 *
 * Validation schemas for email submission and sending tasks.
 */
import { z } from 'zod'

/**
 * Result media reference for email content
 */
const resultMediaSchema = z.object({
  url: z.string().min(1),
  filePath: z.string().min(1),
  displayName: z.string().min(1),
})

/**
 * Payload for submitGuestEmail callable
 * Sent from guest loading screen email capture form
 */
export const submitGuestEmailPayloadSchema = z.object({
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  email: z.string().email(),
})

export type SubmitGuestEmailPayload = z.infer<typeof submitGuestEmailPayloadSchema>

/**
 * Payload for sendSessionEmailTask Cloud Task
 * Enqueued by transformPipelineTask or submitGuestEmail callable
 */
export const sendSessionEmailPayloadSchema = z.object({
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  resultMedia: resultMediaSchema,
  /** Media type discriminator for email template branching */
  format: z.enum(['image', 'gif', 'video']).default('image'),
  /** Video thumbnail URL for email preview (required for video, null for image/gif) */
  thumbnailUrl: z.string().nullable().default(null),
  /** Link to hosted result page (required for video CTA) */
  resultPageUrl: z.string().nullable().default(null),
})

export type SendSessionEmailPayload = z.infer<typeof sendSessionEmailPayloadSchema>
