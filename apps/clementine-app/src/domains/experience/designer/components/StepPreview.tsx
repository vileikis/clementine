/**
 * StepPreview Component
 *
 * Center column showing a preview of the selected step.
 * Wraps PreviewShell for viewport switching and device frame.
 * Uses ThemeProvider for themed step renderers.
 */
import { useMemo } from 'react'
import { StepRendererRouter } from '../../steps'
import type { Step } from '../../steps/registry/step-registry'
import type { Theme } from '@/shared/theming'
import { PreviewShell } from '@/shared/preview-shell'
import {
  ScrollableView,
  ThemeProvider,
  ThemedBackground,
  themeSchema,
} from '@/shared/theming'

/** Default theme for step preview (using schema defaults) */
const DEFAULT_PREVIEW_THEME: Theme = themeSchema.parse({})

interface StepPreviewProps {
  /** The currently selected step, or null if no step selected */
  step: Step | null
  /** Optional theme override for preview */
  theme?: Theme
}

/**
 * Step preview with device frame
 *
 * Shows a visual preview of the selected step in a device frame.
 * Supports viewport switching between mobile and desktop.
 * Wraps content in ThemeProvider for themed styling.
 *
 * @example
 * ```tsx
 * <StepPreview step={selectedStep} />
 *
 * // With custom theme
 * <StepPreview step={selectedStep} theme={customTheme} />
 * ```
 */
export function StepPreview({ step, theme }: StepPreviewProps) {
  // Memoize the theme to avoid unnecessary re-renders
  const previewTheme = useMemo(() => theme ?? DEFAULT_PREVIEW_THEME, [theme])

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <PreviewShell enableViewportSwitcher enableFullscreen>
        <ThemeProvider theme={previewTheme}>
          <ThemedBackground className="h-full">
            <ScrollableView className="items-center gap-6 p-8 max-w-2xl">
              {step ? (
                <StepRendererRouter step={step} mode="edit" />
              ) : (
                <NoStepSelected />
              )}
            </ScrollableView>
          </ThemedBackground>
        </ThemeProvider>
      </PreviewShell>
    </div>
  )
}

/**
 * Placeholder when no step is selected
 */
function NoStepSelected() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground">
        Select a step to preview
      </p>
    </div>
  )
}
