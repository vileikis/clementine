/**
 * EditorRow Component
 *
 * A layout component for displaying a label alongside a control.
 * Supports both inline (horizontal) and stacked (vertical) layouts.
 */

import type { EditorRowProps } from '../types'
import { Label } from '@/ui-kit/ui/label'
import { cn } from '@/shared/utils'

export function EditorRow({
  label,
  htmlFor,
  children,
  stacked = false,
}: EditorRowProps) {
  return (
    <div
      className={cn(
        stacked
          ? 'flex flex-col gap-2'
          : 'grid grid-cols-[1fr_auto] items-center gap-3',
      )}
    >
      <Label
        htmlFor={htmlFor}
        className="text-sm font-normal text-muted-foreground"
      >
        {label}
      </Label>
      <div className={cn(!stacked && 'flex items-center justify-end')}>
        {children}
      </div>
    </div>
  )
}
