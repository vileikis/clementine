/**
 * Permission Loading State
 *
 * Shown while checking camera permission status.
 */

import { Loader2 } from 'lucide-react'
import { ThemedText, useEventTheme } from '@/shared/theming'

export function PermissionLoading() {
  const { theme } = useEventTheme()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2
        className="h-12 w-12 animate-spin"
        style={{ color: theme.text.color, opacity: 0.5 }}
      />
      <ThemedText variant="body" className="opacity-60">
        Preparing camera...
      </ThemedText>
    </div>
  )
}
