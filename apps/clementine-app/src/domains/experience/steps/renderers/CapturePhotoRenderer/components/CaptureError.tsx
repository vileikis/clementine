/**
 * Capture Error State
 *
 * Shown when capture or upload fails. Provides retry and fallback options.
 */

import { CameraOff } from 'lucide-react'
import type { RefObject } from 'react'
import { ThemedButton, ThemedText } from '@/shared/theming'

interface CaptureErrorProps {
  errorMessage: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onRetry: () => void
  onOpenPicker: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function CaptureError({
  errorMessage,
  fileInputRef,
  onRetry,
  onOpenPicker,
  onFileChange,
}: CaptureErrorProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full px-4 py-8">
      {/* Error icon */}
      <div className="p-6 rounded-full bg-white/10">
        <CameraOff className="h-12 w-12 text-white" />
      </div>

      {/* Header */}
      <ThemedText variant="heading" surface="dark" className="text-center">
        Something went wrong
      </ThemedText>

      {/* Error message */}
      <ThemedText
        variant="body"
        surface="dark"
        className="text-center opacity-80"
      >
        {errorMessage}
      </ThemedText>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3">
        <ThemedButton onClick={onRetry} size="md" surface="dark">
          Try Again
        </ThemedButton>
        <ThemedButton
          onClick={onOpenPicker}
          variant="outline"
          surface="dark"
          size="md"
        >
          Upload a Photo Instead
        </ThemedButton>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
