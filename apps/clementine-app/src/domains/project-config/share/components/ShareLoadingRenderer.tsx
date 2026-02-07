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

import type { ShareLoadingConfig } from '@clementine/shared'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import { ScrollableView, ThemedText } from '@/shared/theming'

export interface ShareLoadingRendererProps {
  /** Share loading config to render */
  shareLoading: ShareLoadingConfig
  /**
   * Display mode
   * - edit: Non-interactive WYSIWYG preview in designer
   * - run: Actual guest experience during AI generation
   */
  mode?: 'edit' | 'run'
}

export function ShareLoadingRenderer({
  shareLoading,
  mode: _mode = 'edit',
}: ShareLoadingRendererProps) {
  return (
    <ScrollableView className="items-center gap-6 p-8 max-w-2xl">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-square rounded-lg" />

      {/* Loading title */}
      <ThemedText variant="heading" className="text-center">
        {shareLoading.title || 'Creating your experience...'}
      </ThemedText>

      {/* Loading description */}
      <ThemedText variant="body" className="text-center opacity-90">
        {shareLoading.description ||
          'This usually takes 30-60 seconds. Please wait while we generate your personalized result.'}
      </ThemedText>
    </ScrollableView>
  )
}
