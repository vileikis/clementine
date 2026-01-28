/**
 * VariableMention Component
 *
 * Displays a variable name badge styled like editor mentions.
 * Color-coded by type:
 * - Text variables: info color (blue)
 * - Image variables: success color (green)
 */

import { cn } from '@/shared/utils'

interface VariableMentionProps {
  /** Variable name to display */
  name: string
  /** Variable type for color coding */
  type: 'text' | 'image'
  /** Optional default value to show */
  defaultValue?: string | null
}

/**
 * Variable name badge with type-based color coding.
 * Matches the @{type:name} syntax used in the prompt editor.
 *
 * @example
 * ```tsx
 * <VariableMention name="style" type="text" defaultValue="dramatic" />
 * // Renders: @style (default: dramatic)
 * ```
 */
export function VariableMention({
  name,
  type,
  defaultValue,
}: VariableMentionProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-sm font-medium',
          type === 'text'
            ? 'bg-info/10 text-info dark:bg-info/20'
            : 'bg-success/10 text-success dark:bg-success/20',
        )}
      >
        @{name}
      </span>
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          (default: {defaultValue})
        </span>
      )}
    </div>
  )
}
