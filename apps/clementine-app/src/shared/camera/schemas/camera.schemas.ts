/**
 * Camera Module Schemas
 *
 * Zod schemas for file validation.
 */

import { z } from 'zod'
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '../constants'

/**
 * Zod schema for image file validation
 */
export const imageFileSchema = z
  .instanceof(File, { message: 'Must be a file' })
  .refine(
    (file) =>
      ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
      ),
    {
      message: 'File must be an image (JPEG, PNG, GIF, or WebP)',
    },
  )
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  })

/**
 * Validates a File object for image type and size
 * @param file - The file to validate
 * @returns Result with success status and data or error
 */
export function validateImageFile(file: File): {
  success: boolean
  error?: string
} {
  const result = imageFileSchema.safeParse(file)

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? 'Invalid file',
    }
  }

  return { success: true }
}
