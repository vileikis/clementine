/**
 * ThemePreview Component
 *
 * Display-only preview component showing how the theme will appear
 * in the guest-facing experience. Uses inline styles for theme colors
 * (intentionally not using design system tokens as this shows user colors).
 */

import type { Theme } from '@/shared/theming/schemas/theme.schemas'

export interface ThemePreviewProps {
  /** Theme to preview */
  theme: Theme
}

/**
 * Map button radius enum to CSS border-radius value
 */
function getButtonRadius(radius: Theme['button']['radius']): string {
  switch (radius) {
    case 'square':
      return '0'
    case 'rounded':
      return '0.5rem'
    case 'pill':
      return '9999px'
    default:
      return '0.5rem' // fallback to 'rounded'
  }
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const hasBackgroundImage = theme.background.image !== null

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: theme.background.color,
        fontFamily: theme.fontFamily ?? 'system-ui, sans-serif',
      }}
    >
      {/* Background image layer */}
      {hasBackgroundImage && (
        <>
          <img
            src={theme.background.image!}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: theme.background.color,
              opacity: theme.background.overlayOpacity,
            }}
          />
        </>
      )}

      {/* Content layer */}
      <div
        className="relative flex h-full flex-col items-center justify-center gap-8 p-8"
        style={{
          textAlign: theme.text.alignment,
        }}
      >
        {/* Text samples */}
        <div
          className="space-y-4"
          style={{ color: theme.text.color, width: '100%' }}
        >
          <h1
            className="text-3xl font-bold"
            style={{ textAlign: theme.text.alignment }}
          >
            Event Title
          </h1>
          <p
            className="text-lg opacity-90"
            style={{ textAlign: theme.text.alignment }}
          >
            Sample text preview showing how your content will appear to guests
          </p>
        </div>

        {/* Button sample */}
        <button
          type="button"
          className="px-8 py-3 font-medium shadow-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: theme.button.backgroundColor ?? theme.primaryColor,
            color: theme.button.textColor,
            borderRadius: getButtonRadius(theme.button.radius),
          }}
        >
          Sample Button
        </button>

        {/* Primary color accent */}
        <div className="flex items-center gap-2">
          <div
            className="size-4 rounded-full"
            style={{ backgroundColor: theme.primaryColor }}
          />
          <span
            className="text-sm opacity-75"
            style={{ color: theme.text.color }}
          >
            Primary accent color
          </span>
        </div>
      </div>
    </div>
  )
}
