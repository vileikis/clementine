/**
 * ColorPickerField Component
 *
 * A color picker with native color input and hex text input.
 * Supports optional nullable values for transparent/no color.
 */

import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import { EditorRow } from './EditorRow'
import type { ColorPickerFieldProps } from '../types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui-kit/components/popover'
import { Input } from '@/ui-kit/components/input'
import { Button } from '@/ui-kit/components/button'
import { COLOR_REGEX } from '@/shared/theming/schemas/theme.schemas'

export function ColorPickerField({
  label,
  value,
  onChange,
  nullable = false,
  disabled = false,
}: ColorPickerFieldProps) {
  const id = useId()
  // Local state for hex input (allows invalid intermediate states)
  const [localHex, setLocalHex] = useState(value ?? '#000000')

  // Sync local state when value prop changes
  useEffect(() => {
    setLocalHex(value ?? '#000000')
  }, [value])

  const handleColorInputChange = (newColor: string) => {
    setLocalHex(newColor)
    // Native color picker always returns valid hex
    onChange(newColor)
  }

  const handleHexInputChange = (input: string) => {
    // Ensure # prefix
    const formatted = input.startsWith('#') ? input : `#${input}`
    setLocalHex(formatted)

    // Only update if valid hex
    if (COLOR_REGEX.test(formatted)) {
      onChange(formatted)
    }
  }

  const handleClear = () => {
    onChange(null)
    setLocalHex('#000000')
  }

  const displayColor = value ?? '#000000'
  const hasColor = value !== null

  return (
    <EditorRow label={label} htmlFor={id}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={id}
            disabled={disabled}
            className="size-8 rounded-md border border-input shadow-sm transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: hasColor ? displayColor : 'transparent',
              backgroundImage: !hasColor
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : undefined,
              backgroundSize: !hasColor ? '8px 8px' : undefined,
              backgroundPosition: !hasColor
                ? '0 0, 0 4px, 4px -4px, -4px 0px'
                : undefined,
            }}
            aria-label={`Select ${label.toLowerCase()} color`}
          />
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-3">
          {/* Native color picker */}
          <input
            type="color"
            value={displayColor}
            onChange={(e) => handleColorInputChange(e.target.value)}
            disabled={disabled}
            className="h-32 w-full cursor-pointer rounded border-0"
          />

          {/* Hex input */}
          <Input
            value={localHex.toUpperCase()}
            onChange={(e) => handleHexInputChange(e.target.value)}
            placeholder="#000000"
            disabled={disabled}
            maxLength={7}
            className="font-mono text-sm"
          />

          {/* Clear button (only if nullable) */}
          {nullable && hasColor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="w-full gap-2"
            >
              <X className="size-4" />
              Clear color
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </EditorRow>
  )
}
