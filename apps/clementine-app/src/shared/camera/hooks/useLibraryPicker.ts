/**
 * useLibraryPicker Hook
 *
 * Manages file input for selecting photos from device library.
 * Extracted from usePhotoCapture to separate concerns.
 */

import { useCallback, useRef } from 'react'
import { getImageDimensions } from '../lib'
import { validateImageFile } from '../schemas'
import type { ChangeEvent, RefObject } from 'react'
import type { CameraCaptureError, CapturedPhoto } from '../types'

interface UseLibraryPickerOptions {
  /** Called when a photo is selected and processed */
  onSelect?: (photo: CapturedPhoto) => void
  /** Called when an error occurs */
  onError?: (error: CameraCaptureError) => void
}

interface UseLibraryPickerReturn {
  /** Ref to attach to hidden file input */
  fileInputRef: RefObject<HTMLInputElement | null>
  /** Programmatically open the file picker */
  openPicker: () => void
  /** Handle file input change event */
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

/**
 * Hook for selecting photos from device library
 *
 * @param options - Configuration options
 * @returns File input ref and handlers
 *
 * @example
 * ```tsx
 * const { fileInputRef, openPicker, handleFileChange } = useLibraryPicker({
 *   onSelect: (photo) => setPhoto(photo),
 *   onError: (error) => showError(error),
 * });
 *
 * return (
 *   <>
 *     <input ref={fileInputRef} type="file" onChange={handleFileChange} hidden />
 *     <button onClick={openPicker}>Choose from Library</button>
 *   </>
 * );
 * ```
 */
export function useLibraryPicker(
  options: UseLibraryPickerOptions = {},
): UseLibraryPickerReturn {
  const { onSelect, onError } = options

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Open file picker programmatically
  const openPicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Process selected file
  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Reset input so same file can be selected again
      event.target.value = ''

      // Validate file type and size
      const validation = validateImageFile(file)
      if (!validation.success) {
        const error: CameraCaptureError = {
          code: 'INVALID_FILE_TYPE',
          message: validation.error ?? 'Please select an image file',
        }
        onError?.(error)
        return
      }

      try {
        const dimensions = await getImageDimensions(file)
        const previewUrl = URL.createObjectURL(file)

        const photo: CapturedPhoto = {
          previewUrl,
          file,
          method: 'library',
          width: dimensions.width,
          height: dimensions.height,
        }

        onSelect?.(photo)
      } catch (err) {
        const error: CameraCaptureError = {
          code: 'CAPTURE_FAILED',
          message:
            err instanceof Error ? err.message : 'Failed to process image',
        }
        onError?.(error)
      }
    },
    [onSelect, onError],
  )

  return {
    fileInputRef,
    openPicker,
    handleFileChange,
  }
}
