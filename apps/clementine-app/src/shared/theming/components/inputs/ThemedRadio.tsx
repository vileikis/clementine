/**
 * ThemedRadio Component
 *
 * Radio input primitive that applies theme styles.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedRadio name="choice" value="a" label="Option A" />
 * <ThemedRadio name="choice" value="b" label="Option B" />
 *
 * // Controlled radio group
 * <ThemedRadio
 *   name="size"
 *   value="small"
 *   label="Small"
 *   checked={size === 'small'}
 *   onChange={() => setSize('small')}
 * />
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { CSSProperties, InputHTMLAttributes } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedRadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'style' | 'type'
> {
  /** Label text to display next to radio button */
  label: string
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedRadio({
  label,
  theme: themeOverride,
  className,
  disabled,
  checked,
  ...props
}: ThemedRadioProps) {
  const theme = useThemeWithOverride(themeOverride)

  const circleStyle: CSSProperties = {
    borderColor: checked
      ? theme.primaryColor
      : `color-mix(in srgb, ${theme.text.color} 40%, transparent)`,
  }

  const dotStyle: CSSProperties = {
    backgroundColor: theme.primaryColor,
  }

  const labelStyle: CSSProperties = {
    color: theme.text.color,
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
        type="radio"
        disabled={disabled}
        checked={checked}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          'flex items-center justify-center',
          'h-6 w-6 shrink-0 rounded-full',
          'border-2 transition-colors',
        )}
        style={circleStyle}
      >
        {checked && <div className="h-3 w-3 rounded-full" style={dotStyle} />}
      </div>
      <span className="text-base" style={labelStyle}>
        {label}
      </span>
    </label>
  )
}
