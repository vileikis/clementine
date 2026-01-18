/**
 * Permission Prompt
 *
 * Prompts user to grant camera access (undetermined state).
 */

import { Camera } from 'lucide-react'
import { ThemedButton, ThemedText, useEventTheme } from '@/shared/theming'

interface PermissionPromptProps {
  onRequestPermission: () => void
}

export function PermissionPrompt({ onRequestPermission }: PermissionPromptProps) {
  const { theme } = useEventTheme()

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-8">
      {/* Camera icon */}
      <div
        className="p-6 rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
        }}
      >
        <Camera className="h-12 w-12" style={{ color: theme.text.color }} />
      </div>

      {/* Header */}
      <ThemedText variant="heading" className="text-center">
        Camera Access Needed
      </ThemedText>

      {/* Description */}
      <ThemedText variant="body" className="text-center opacity-80">
        We need camera access to take your photo
      </ThemedText>

      {/* Action button */}
      <ThemedButton
        onClick={onRequestPermission}
        size="lg"
        className="w-full"
      >
        Allow Camera
      </ThemedButton>
    </div>
  )
}
