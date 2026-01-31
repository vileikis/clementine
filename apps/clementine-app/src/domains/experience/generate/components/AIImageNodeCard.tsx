/**
 * AIImageNodeCard Component
 *
 * Card displaying AI Image node summary with model, aspect ratio, and prompt preview.
 * Hover shows delete button. Click selects node for editing.
 */
import { Trash2 } from 'lucide-react'

import type { AIImageNodeConfig, TransformNode } from '@clementine/shared'
import { Badge } from '@/ui-kit/ui/badge'
import { Button } from '@/ui-kit/ui/button'
import { Card, CardContent, CardHeader } from '@/ui-kit/ui/card'

export interface AIImageNodeCardProps {
  /** Transform node data */
  node: TransformNode
  /** Whether this node is selected */
  isSelected?: boolean
  /** Click handler for selecting node */
  onSelect?: () => void
  /** Click handler for delete button */
  onDelete?: () => void
  /** Optional additional className */
  className?: string
}

/**
 * AI Image Node Card
 *
 * Features:
 * - Badge showing node type
 * - Model and aspect ratio display
 * - Prompt preview (50 characters)
 * - Hover delete button (44px touch target)
 * - Visual selected state
 * - Click to select for editing
 */
export function AIImageNodeCard({
  node,
  isSelected = false,
  onSelect,
  onDelete,
  className,
}: AIImageNodeCardProps) {
  const config = node.config as AIImageNodeConfig

  // Truncate prompt to 50 characters
  const promptPreview =
    config.prompt.length > 50
      ? `${config.prompt.slice(0, 50)}...`
      : config.prompt || '(No prompt)'

  return (
    <Card
      className={`group relative cursor-pointer transition-colors hover:bg-accent ${isSelected ? 'ring-2 ring-primary' : ''} ${className ?? ''}`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Badge variant="secondary">AI Image</Badge>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 opacity-0 group-hover:opacity-100"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete node</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Model: <span className="font-medium">{config.model}</span>
          </span>
          <span>
            Aspect: <span className="font-medium">{config.aspectRatio}</span>
          </span>
        </div>
        <p className="text-sm text-foreground">{promptPreview}</p>
      </CardContent>
    </Card>
  )
}
