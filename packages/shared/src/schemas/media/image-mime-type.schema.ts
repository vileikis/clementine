/**
 * Image MIME Type Schema
 *
 * Allowed image MIME types for upload validation.
 */
import { z } from 'zod'

export const imageMimeTypeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])

export type ImageMimeType = z.infer<typeof imageMimeTypeSchema>
