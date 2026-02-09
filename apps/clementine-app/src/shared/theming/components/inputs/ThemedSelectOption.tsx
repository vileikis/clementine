/**
 * ThemedSelectOption Component
 *
 * Pill-style selectable option for single or multi-select choices.
 * Works for both radio (single select) and checkbox (multi select) use cases.
 * Uses theme primary color for selected state.
 *
 * @example
 * ```tsx
 * // Single select (radio behavior)
 * <ThemedSelectOption
 *   label="Option A"
 *   selected={selected === 'a'}
 *   onClick={() => setSelected('a')}
 * />
 *
 * // Multi select (checkbox behavior)
 * <ThemedSelectOption
 *   label="Option B"
 *   selected={selections.includes('b')}
 *   onClick={() => toggleSelection('b')}
 * />
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedSelectOptionProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  /** Label text to display */
  label: string
  /** Whether this option is currently selected */
  selected?: boolean
  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

export function ThemedSelectOption({
  label,
  selected = false,
  theme: themeOverride,
  className,
  disabled,
  ...props
}: ThemedSelectOptionProps) {
  const theme = useThemeWithOverride(themeOverride)

  // Use pill-style border radius
  const borderRadius = '9999px'

  const style: CSSProperties = selected
    ? {
        backgroundColor: theme.primaryColor,
        color: theme.button.textColor,
        borderColor: theme.primaryColor,
        borderRadius,
        fontFamily: 'inherit',
      }
    : {
        backgroundColor: 'transparent',
        color: theme.text.color,
        borderColor: `color-mix(in srgb, ${theme.text.color} 30%, transparent)`,
        borderRadius,
        fontFamily: 'inherit',
      }

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'w-full px-5 py-3 text-left text-base',
        'border-2 transition-all',
        'min-h-[48px]', // Touch target
        'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={style}
      {...props}
    >
      {label}
    </button>
  )
}
