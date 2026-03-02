/**
 * Permission Loading State
 *
 * Shown while checking camera permission status.
 */

import { Loader2 } from 'lucide-react'
import { ThemedText } from '@/shared/theming'

export function PermissionLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="h-12 w-12 animate-spin text-white/50" />
      <ThemedText variant="body" surface="dark" className="opacity-60">
        Preparing camera...
      </ThemedText>
    </div>
  )
}
