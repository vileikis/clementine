'use client'

import { Maximize2 } from 'lucide-react'
import type { FullscreenTriggerProps } from '../types/preview-shell.types'
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/shared/utils'

/**
 * Fullscreen Trigger Component
 *
 * Button to activate fullscreen overlay mode
 * Uses lucide-react Maximize2 icon
 */
export function FullscreenTrigger({
  onClick,
  className,
}: FullscreenTriggerProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className={cn('h-11 w-11', className)}
      aria-label="Enter fullscreen mode"
    >
      <Maximize2 size={20} />
    </Button>
  )
}
