/**
 * NodeListItem Component
 *
 * Collapsible node item with drag handle outside the card.
 * Index number on the left, replaced by drag handle on hover.
 */
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Copy, GripVertical, Trash2 } from 'lucide-react'

import type { AIImageNodeConfig, TransformNode } from '@clementine/shared'
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
 * Node list item with collapsible settings
 *
 * Features:
 * - Index number outside card (hover shows drag handle)
 * - Clickable header to expand/collapse
 * - Context menu with duplicate/delete
 * - Inline settings when expanded
 */
export function NodeListItem({
  node,
  index,
  onDuplicate,
  onDelete,
}: NodeListItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const config = node.config as AIImageNodeConfig

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

  // Truncate prompt for display
  const promptPreview = config.prompt
    ? config.prompt.length > 60
      ? `${config.prompt.slice(0, 60)}...`
      : config.prompt
    : '(No prompt configured)'

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
        {isHovered ? (
          <GripVertical className="h-4 w-4" />
        ) : (
          <span>{index}</span>
        )}
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
              {/* Node label */}
              <div className="min-w-0 flex-1">
                <div className="font-medium">AI Image Node</div>
                <div className="truncate text-sm text-muted-foreground">
                  {config.model} · {config.aspectRatio}
                </div>
              </div>

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
            <div className="space-y-4 border-t px-3 pb-4 pt-4">
              {/* Model Settings placeholder */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Model Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Phase 1e: Model and aspect ratio controls
                </p>
              </div>

              {/* Prompt placeholder */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Prompt</h4>
                <p className="text-sm text-muted-foreground">{promptPreview}</p>
              </div>

              {/* Reference Media placeholder */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Reference Media</h4>
                <p className="text-sm text-muted-foreground">
                  Phase 1c: Upload and manage reference media
                  {config.refMedia.length > 0 &&
                    ` (${config.refMedia.length} items)`}
                </p>
              </div>

              {/* Test Run placeholder */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Test Run</h4>
                <p className="text-sm text-muted-foreground">
                  Phase 1g: Test prompt resolution and generate preview
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}
