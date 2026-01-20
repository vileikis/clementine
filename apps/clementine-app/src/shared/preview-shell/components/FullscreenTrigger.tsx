'use client'

import { Maximize2 } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

export interface FullscreenTriggerProps {
  onClick: () => void
  className?: string
}

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
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('h-9 w-9', className)}
      aria-label="Enter fullscreen mode"
    >
      <Maximize2 size={20} />
    </Button>
  )
}
