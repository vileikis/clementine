/**
 * AIImageNode Components
 *
 * Header and Settings components for AI Image nodes.
 * Kept together for maintainability.
 */
import { PromptComposer } from '../PromptComposer'

import type { AIImageNode, TransformConfig } from '@clementine/shared'

export interface AIImageNodeProps {
  /** AI Image node data */
  node: AIImageNode
}

export interface AIImageNodeSettingsProps extends AIImageNodeProps {
  /** Current transform configuration */
  transform: TransformConfig
  /** Callback to update transform configuration */
  onUpdate: (transform: TransformConfig) => void
}

/**
 * AI Image Node Header
 *
 * Renders the summary line shown in the collapsed header:
 * - Node type label
 * - Model and aspect ratio
 */
export function AIImageNodeHeader({ node }: AIImageNodeProps) {
  const { config } = node

  return (
    <div className="min-w-0 flex-1">
      <div className="font-medium">AI Image Node</div>
      <div className="truncate text-sm text-muted-foreground">
        {config.model} · {config.aspectRatio}
      </div>
    </div>
  )
}

/**
 * AI Image Node Settings
 *
 * Renders the expanded settings:
 * - PromptComposer (prompt input, model/aspect ratio selectors, reference media)
 * - Test Run placeholder
 */
export function AIImageNodeSettings({
  node,
  transform,
  onUpdate,
}: AIImageNodeSettingsProps) {
  return (
    <div className="space-y-4 border-t px-3 pb-4 pt-4">
      <PromptComposer node={node} transform={transform} onUpdate={onUpdate} />
    </div>
  )
}
