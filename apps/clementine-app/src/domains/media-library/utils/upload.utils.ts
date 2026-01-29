import { nanoid } from 'nanoid'
import { ALLOWED_TYPES, MAX_SIZE } from '../constants'

/**
 * Validate file type and size
 * @throws Error if file is invalid
 */
export function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error('Only PNG, JPG, WebP, and GIF images are supported')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File must be under 5MB')
  }
}

/**
 * Extract image dimensions from a file
 * @param file - Image file to extract dimensions from
 * @returns Promise with width and height
 */
export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Generate unique file name with nanoid
 * @param originalFile - Original file to generate name for
 * @returns Unique file name in format: {nanoid}.{ext}
 */
export function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `${nanoid()}.${ext}`
}
