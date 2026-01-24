import { z } from 'zod'

/**
 * Image MIME Type Schema
 *
 * Defines the allowed image MIME types for media uploads.
 * Used by media-asset schema and MediaPickerField component.
 */
export const imageMimeTypeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])

export type ImageMimeType = z.infer<typeof imageMimeTypeSchema>
