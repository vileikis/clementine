/**
 * ThemedCheckbox Component
 *
 * Checkbox input primitive that applies theme styles.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedCheckbox label="I agree to the terms" />
 *
 * // Controlled checkbox
 * <ThemedCheckbox
 *   label="Subscribe to newsletter"
 *   checked={subscribed}
 *   onChange={(e) => setSubscribed(e.target.checked)}
 * />
 * ```
 */

import { Check } from 'lucide-react'
import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import { BUTTON_RADIUS_MAP } from '../../constants'
import type { CSSProperties, InputHTMLAttributes } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'style' | 'type'
> {
  /** Label text to display next to checkbox */
  label: string
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedCheckbox({
  label,
  theme: themeOverride,
  className,
  disabled,
  checked,
  ...props
}: ThemedCheckboxProps) {
  const theme = useThemeWithOverride(themeOverride)

  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]
  // Use smaller radius for checkbox, max out at 6px
  const checkboxRadius = Math.min(parseInt(borderRadius) || 4, 6)

  const boxStyle: CSSProperties = {
    borderColor: checked
      ? theme.primaryColor
      : `color-mix(in srgb, ${theme.text.color} 40%, transparent)`,
    backgroundColor: checked ? theme.primaryColor : 'transparent',
    borderRadius: `${checkboxRadius}px`,
  }

  const labelStyle: CSSProperties = {
    color: theme.text.color,
    fontFamily: theme.fontFamily ?? undefined,
  }

  return (
    <label
      className={cn(
        'flex items-center gap-3 cursor-pointer',
        'min-h-[44px]', // Touch target
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          'flex items-center justify-center',
          'h-6 w-6 shrink-0',
          'border-2 transition-colors',
        )}
        style={boxStyle}
      >
        {checked && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </div>
      <span className="text-base" style={labelStyle}>
        {label}
      </span>
    </label>
  )
}
