/**
 * EditorSection Component
 *
 * A collapsible section wrapper for grouping related editor controls.
 * Used to organize theme/settings editors into logical groups.
 */

import { ChevronDown } from 'lucide-react'
import type { EditorSectionProps } from '../types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui-kit/ui/collapsible'
import { cn } from '@/shared/utils'

export function EditorSection({
  title,
  children,
  defaultOpen = true,
}: EditorSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-b border-border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-200',
            'group-data-[state=open]:rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
