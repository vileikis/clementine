'use client'

import { Monitor, Smartphone } from 'lucide-react'
import type { ViewportSwitcherProps } from '../types/preview-shell.types'
import { cn } from '@/shared/utils'

/**
 * Viewport Switcher Component
 *
 * Toggle buttons for switching between mobile and desktop viewports
 * Supports size variants and accessibility requirements
 */
export function ViewportSwitcher({
  mode,
  onModeChange,
  size = 'md',
  className,
}: ViewportSwitcherProps) {
  const buttonSize = size === 'sm' ? 'h-10 w-10' : 'h-11 w-11'
  const iconSize = size === 'sm' ? 18 : 20

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border bg-background p-1',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onModeChange('mobile')}
        className={cn(
          'flex items-center justify-center rounded-md transition-all',
          buttonSize,
          mode === 'mobile'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        aria-label="Switch to mobile viewport"
        aria-pressed={mode === 'mobile'}
      >
        <Smartphone size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => onModeChange('desktop')}
        className={cn(
          'flex items-center justify-center rounded-md transition-all',
          buttonSize,
          mode === 'desktop'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        aria-label="Switch to desktop viewport"
        aria-pressed={mode === 'desktop'}
      >
        <Monitor size={iconSize} />
      </button>
    </div>
  )
}
