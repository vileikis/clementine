/**
 * Permission Prompt
 *
 * Prompts user to grant camera access (undetermined state).
 */

import { Camera } from 'lucide-react'
import { ThemedButton, ThemedText } from '@/shared/theming'

interface PermissionPromptProps {
  onRequestPermission: () => void
}

export function PermissionPrompt({
  onRequestPermission,
}: PermissionPromptProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full px-4 py-8">
      {/* Camera icon */}
      <div className="p-6 rounded-full bg-white/10">
        <Camera className="h-12 w-12 text-white" />
      </div>

      {/* Header */}
      <ThemedText variant="heading" surface="dark" className="text-center">
        Camera Access Needed
      </ThemedText>

      {/* Description */}
      <ThemedText
        variant="body"
        surface="dark"
        className="text-center opacity-80"
      >
        We need camera access to take your photo
      </ThemedText>

      {/* Action button */}
      <ThemedButton onClick={onRequestPermission} size="md" surface="dark">
        Allow Camera
      </ThemedButton>
    </div>
  )
}
