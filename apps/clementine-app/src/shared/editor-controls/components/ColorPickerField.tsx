/**
 * ColorPickerField Component
 *
 * A color picker with preset color palette, custom color input, and hex field.
 * Supports optional nullable values for transparent/no color.
 */

import { useEffect, useId, useRef, useState } from 'react'
import { Pipette, X } from 'lucide-react'
import { EditorRow } from './EditorRow'
import type { ColorPickerFieldProps } from '../types'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-kit/ui/popover'
import { Input } from '@/ui-kit/ui/input'
import { Button } from '@/ui-kit/ui/button'
import { COLOR_REGEX } from '@/shared/theming/schemas/theme.schemas'
import { cn } from '@/shared/utils'

/** Preset color palette - curated for common use cases */
const COLOR_PRESETS = [
  // Row 1: Neutrals
  '#FFFFFF',
  '#F5F5F5',
  '#E5E5E5',
  '#A3A3A3',
  '#737373',
  '#404040',
  '#171717',
  '#000000',
  // Row 2: Primary colors
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  // Row 3: Light variants
  '#FEE2E2',
  '#FFEDD5',
  '#FEF9C3',
  '#DCFCE7',
  '#CCFBF1',
  '#DBEAFE',
  '#EDE9FE',
  '#FCE7F3',
]

export function ColorPickerField({
  label,
  value,
  onChange,
  nullable = false,
  disabled = false,
}: ColorPickerFieldProps) {
  const id = useId()
  const colorInputRef = useRef<HTMLInputElement>(null)
  // Local state for hex input (allows invalid intermediate states)
  const [localHex, setLocalHex] = useState(value ?? '#000000')

  // Sync local state when value prop changes
  useEffect(() => {
    setLocalHex(value ?? '#000000')
  }, [value])

  const handlePresetClick = (color: string) => {
    setLocalHex(color)
    onChange(color)
  }

  const handleCustomColorClick = () => {
    colorInputRef.current?.click()
  }

  const handleColorInputChange = (newColor: string) => {
    // Normalize to uppercase for consistent preset matching
    const normalized = newColor.toUpperCase()
    setLocalHex(normalized)
    onChange(normalized)
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
        <PopoverContent className="w-[232px] space-y-3 p-3">
          {/* Color palette grid */}
          <div className="grid grid-cols-8 gap-1">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                disabled={disabled}
                onClick={() => handlePresetClick(color)}
                className={cn(
                  'size-6 rounded border transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                  value === color
                    ? 'ring-2 ring-ring ring-offset-1'
                    : 'border-border',
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          {/* Custom color picker + Hex input row */}
          <div className="flex items-center gap-2">
            {/* Hidden native color input */}
            <input
              ref={colorInputRef}
              type="color"
              value={displayColor}
              onChange={(e) => handleColorInputChange(e.target.value)}
              disabled={disabled}
              className="sr-only"
            />

            {/* Custom color button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCustomColorClick}
              disabled={disabled}
              className="shrink-0"
              aria-label="Pick custom color"
            >
              <Pipette className="size-4" />
            </Button>

            {/* Hex input */}
            <Input
              value={localHex.toUpperCase()}
              onChange={(e) => handleHexInputChange(e.target.value)}
              placeholder="#000000"
              disabled={disabled}
              maxLength={7}
              className="font-mono text-sm"
            />
          </div>

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
