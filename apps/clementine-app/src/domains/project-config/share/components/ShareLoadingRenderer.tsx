/**
 * ShareLoadingRenderer Component
 *
 * Renders the loading state shown to guests while AI generation is in progress.
 * Uses ThemedText and ThemedBackground primitives from shared theming module.
 *
 * WYSIWYG Principle: What creators see in preview is exactly what guests see.
 *
 * Must be used within a ThemeProvider.
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { EmailCaptureForm } from './EmailCaptureForm'
import type {
  EmailCaptureConfig,
  Session,
  ShareLoadingConfig,
} from '@clementine/shared'
import {
  ScrollableView,
  ThemedText,
  useThemeWithOverride,
} from '@/shared/theming'

export interface ShareLoadingRendererProps {
  /** Share loading config to render */
  shareLoading: ShareLoadingConfig
  /**
   * Display mode
   * - edit: Non-interactive WYSIWYG preview in designer
   * - run: Actual guest experience during AI generation
   */
  mode?: 'edit' | 'run'
  /** Session data for email state (run mode only) */
  session?: Session | null
  /** Email capture config from project config */
  emailCaptureConfig?: EmailCaptureConfig | null
  /** Callback when guest submits email */
  onEmailSubmit?: (email: string) => Promise<void>
}

export function ShareLoadingRenderer({
  shareLoading,
  mode = 'edit',
  session,
  emailCaptureConfig,
  onEmailSubmit,
}: ShareLoadingRendererProps) {
  const theme = useThemeWithOverride()
  const showEmailCapture =
    mode === 'run' && emailCaptureConfig?.enabled && onEmailSubmit

  // Elapsed time counter (run mode only)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (mode !== 'run') return
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [mode])

  return (
    <ScrollableView className="items-center gap-6 p-8 max-w-2xl">
      {/* Themed spinner */}
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-12 w-12 animate-spin opacity-60"
          style={{ color: theme.primaryColor }}
        />
        {mode === 'run' && (
          <ThemedText variant="body" className="text-center opacity-60 text-sm">
            {elapsed}s
          </ThemedText>
        )}
      </div>

      {/* Loading title */}
      <ThemedText variant="heading" className="text-center">
        {shareLoading.title || 'Creating your experience...'}
      </ThemedText>

      {/* Loading description */}
      <ThemedText variant="body" className="text-center opacity-90">
        {shareLoading.description ||
          'This usually takes 30-60 seconds. Please wait while we generate your personalized result.'}
      </ThemedText>

      {/* Email capture form */}
      {showEmailCapture && (
        <EmailCaptureForm
          onSubmit={onEmailSubmit}
          isSubmitted={
            session?.guestEmail !== null && session?.guestEmail !== undefined
          }
          submittedEmail={session?.guestEmail ?? null}
          heading={emailCaptureConfig.heading}
        />
      )}
    </ScrollableView>
  )
}
