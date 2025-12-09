/**
 * Camera Module Schemas
 *
 * Zod schemas for file validation.
 */

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "../constants";

/**
 * Validates a File object for image type and size
 * @param file - The file to validate
 * @returns Result with success status and data or error
 */
export function validateImageFile(file: File): {
  success: boolean;
  error?: string;
} {
  // Check file type manually for better error messages
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
    return {
      success: false,
      error: "File must be an image (JPEG, PNG, GIF, or WebP)",
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { success: true };
}
