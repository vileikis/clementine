/**
 * Capture Error State
 *
 * Shown when capture or upload fails. Provides retry and fallback options.
 */

import { CameraOff } from 'lucide-react'
import type { RefObject } from 'react'
import { ThemedButton, ThemedText, useEventTheme } from '@/shared/theming'

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
  const { theme } = useEventTheme()

  return (
    <div className="flex flex-col items-center gap-6 w-full px-4 py-8">
      {/* Error icon */}
      <div
        className="p-6 rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
        }}
      >
        <CameraOff className="h-12 w-12" style={{ color: theme.text.color }} />
      </div>

      {/* Header */}
      <ThemedText variant="heading" className="text-center">
        Something went wrong
      </ThemedText>

      {/* Error message */}
      <ThemedText variant="body" className="text-center opacity-80">
        {errorMessage}
      </ThemedText>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        <ThemedButton onClick={onRetry} size="lg" className="w-full">
          Try Again
        </ThemedButton>
        <ThemedButton
          onClick={onOpenPicker}
          variant="outline"
          size="lg"
          className="w-full"
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
