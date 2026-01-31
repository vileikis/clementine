/**
 * NodeListItem Component
 *
 * Wrapper component for transform nodes with drag handle,
 * collapse/expand, and context menu actions.
 * Delegates content rendering to NodeCardContent.
 */
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Copy, Trash2 } from 'lucide-react'

import { NodeHeader } from './NodeHeader'
import { NodeSettings } from './NodeSettings'
import type { TransformNode } from '@clementine/shared'
import { cn } from '@/shared/utils'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'
import { Button } from '@/ui-kit/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui-kit/ui/collapsible'

export interface NodeListItemProps {
  /** Transform node data */
  node: TransformNode
  /** 1-based index for display */
  index: number
  /** Callback when duplicate is clicked */
  onDuplicate: () => void
  /** Callback when delete is clicked */
  onDelete: () => void
}

/**
 * Node List Item
 *
 * Features:
 * - Index number outside card (hover shows drag cursor)
 * - Clickable header to expand/collapse
 * - Context menu with duplicate/delete
 * - Delegates content to NodeCardContent (registry pattern)
 */
export function NodeListItem({
  node,
  index,
  onDuplicate,
  onDelete,
}: NodeListItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex gap-3', isDragging && 'opacity-50')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Index number / Drag handle - outside the card */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all',
          isHovered
            ? 'cursor-grab bg-muted text-muted-foreground active:cursor-grabbing'
            : 'bg-primary/10 text-primary',
        )}
      >
        <span>{index}</span>
      </div>

      {/* Collapsible card */}
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="min-w-0 flex-1"
      >
        <div
          className={cn(
            'rounded-lg border bg-card transition-shadow',
            isDragging && 'shadow-lg',
          )}
        >
          {/* Header row - clickable to toggle */}
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center gap-3 p-3 hover:bg-accent/50">
              {/* Node-specific header content */}
              <NodeHeader node={node} />

              {/* Collapse indicator */}
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180',
                )}
              />

              {/* Context menu - stop propagation to prevent toggle */}
              <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <ContextDropdownMenu
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                    >
                      <span className="sr-only">Node actions</span>
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </Button>
                  }
                  actions={[
                    {
                      key: 'duplicate',
                      label: 'Duplicate',
                      icon: Copy,
                      onClick: onDuplicate,
                    },
                    {
                      key: 'delete',
                      label: 'Delete',
                      icon: Trash2,
                      onClick: onDelete,
                      destructive: true,
                    },
                  ]}
                  aria-label="Node actions"
                />
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Collapsible content - Node settings */}
          <CollapsibleContent>
            <NodeSettings node={node} />
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}
