'use client'

import { Monitor, Smartphone } from 'lucide-react'
import type { ViewportSwitcherProps } from '../types/preview-shell.types'
import { ToggleGroup, ToggleGroupItem } from '@/ui-kit/components/toggle-group'

/**
 * Viewport Switcher Component
 *
 * Toggle group for switching between mobile and desktop viewports
 * Uses Radix UI Toggle Group for accessible toggle functionality
 */
export function ViewportSwitcher({
  mode,
  onModeChange,
  size = 'md',
  className,
}: ViewportSwitcherProps) {
  const itemSize = size === 'sm' ? 'sm' : 'default'
  const iconSize = size === 'sm' ? 18 : 20

  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value: string) => {
        if (value) onModeChange(value as typeof mode)
      }}
      className={className}
    >
      <ToggleGroupItem
        value="mobile"
        aria-label="Switch to mobile viewport"
        size={itemSize}
      >
        <Smartphone size={iconSize} />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="desktop"
        aria-label="Switch to desktop viewport"
        size={itemSize}
      >
        <Monitor size={iconSize} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
