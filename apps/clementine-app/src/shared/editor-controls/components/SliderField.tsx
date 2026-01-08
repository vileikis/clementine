/**
 * SliderField Component
 *
 * A slider with label and value display.
 * Supports custom value formatting (e.g., percentage display).
 */

import { useId } from 'react'
import { EditorRow } from './EditorRow'
import type { SliderFieldProps } from '../types'
import { Slider } from '@/ui-kit/ui/slider'

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue = (v) => String(v),
  disabled = false,
}: SliderFieldProps) {
  const id = useId()

  return (
    <EditorRow label={label} htmlFor={id} stacked>
      <div className="flex items-center gap-3">
        <Slider
          id={id}
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="flex-1"
        />
        <span className="w-12 text-right text-sm text-muted-foreground tabular-nums">
          {formatValue(value)}
        </span>
      </div>
    </EditorRow>
  )
}
