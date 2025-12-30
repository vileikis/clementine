/**
 * LibraryPicker Component
 *
 * Hidden file input wrapper for selecting photos from device gallery.
 * Handles file validation and provides imperative open API.
 */

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { validateImageFile } from '../schemas'
import { ACCEPTED_IMAGE_TYPES } from '../constants'
import type { CameraCaptureError } from '../types'

interface LibraryPickerProps {
  /** Called when a valid file is selected */
  onFileSelect: (file: File) => void
  /** Called when file validation fails */
  onError?: (error: CameraCaptureError) => void
  /** Whether to use capture attribute for mobile fallback */
  useCaptureAttribute?: boolean
}

export interface LibraryPickerRef {
  /** Open the file picker */
  open: () => void
}

/**
 * LibraryPicker - Hidden file input for photo selection
 *
 * Provides imperative API for opening file picker and handles
 * file validation before passing to consumer.
 *
 * @example
 * ```tsx
 * const pickerRef = useRef<LibraryPickerRef>(null);
 *
 * return (
 *   <>
 *     <button onClick={() => pickerRef.current?.open()}>
 *       Choose Photo
 *     </button>
 *     <LibraryPicker
 *       ref={pickerRef}
 *       onFileSelect={(file) => processFile(file)}
 *       onError={(error) => showError(error)}
 *     />
 *   </>
 * );
 * ```
 */
export const LibraryPicker = forwardRef<LibraryPickerRef, LibraryPickerProps>(
  function LibraryPicker(
    { onFileSelect, onError, useCaptureAttribute = true },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null)

    // Expose open method to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        inputRef.current?.click()
      },
    }))

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type and size
        const validation = validateImageFile(file)
        if (!validation.success) {
          const error: CameraCaptureError = {
            code: 'INVALID_FILE_TYPE',
            message: validation.error ?? 'Please select an image file',
          }
          onError?.(error)
          // Reset input so user can try again
          event.target.value = ''
          return
        }

        onFileSelect(file)

        // Reset input so same file can be selected again
        event.target.value = ''
      },
      [onFileSelect, onError],
    )

    return (
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        capture={useCaptureAttribute ? 'environment' : undefined}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    )
  },
)
