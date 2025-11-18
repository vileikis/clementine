"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface BrandColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function BrandColorPicker({
  value,
  onChange,
  disabled = false,
}: BrandColorPickerProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.toUpperCase()
    setLocalValue(newColor)
    onChange(newColor)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.toUpperCase()

    // Add # if not present
    if (!inputValue.startsWith("#")) {
      inputValue = "#" + inputValue
    }

    // Only allow valid hex characters
    if (/^#[0-9A-F]{0,6}$/.test(inputValue)) {
      setLocalValue(inputValue)

      // Only trigger onChange if we have a complete hex color
      if (/^#[0-9A-F]{6}$/.test(inputValue)) {
        onChange(inputValue)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="color"
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "w-16 h-16 rounded-lg cursor-pointer border-2 border-border",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            title="Pick a color"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="hex-input" className="block text-sm font-medium mb-2">
            Hex Color
          </label>
          <input
            id="hex-input"
            type="text"
            value={localValue}
            onChange={handleInputChange}
            disabled={disabled}
            maxLength={7}
            placeholder="#0EA5E9"
            className={cn(
              "w-full px-3 py-2 rounded-md border-2 border-border",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground",
              "font-mono text-sm uppercase",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter a 6-digit hex color code
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Preview:</span>
        <div
          className="w-full h-12 rounded-md border-2 border-border"
          style={{ backgroundColor: localValue }}
        />
      </div>
    </div>
  )
}
