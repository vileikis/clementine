/**
 * AIImageNode Components
 *
 * Header and Settings components for AI Image nodes.
 * Kept together for maintainability.
 */
import { PromptComposer } from '../PromptComposer'

import type {
  AIImageNode,
  ExperienceStep,
  TransformNode,
} from '@clementine/shared'

export interface AIImageNodeProps {
  /** AI Image node data */
  node: AIImageNode
}

export interface AIImageNodeSettingsProps extends AIImageNodeProps {
  /** Current transform nodes array */
  transformNodes: TransformNode[]
  /** Experience steps for @mention in prompt editor */
  steps: ExperienceStep[]
  /** Workspace ID for media uploads */
  workspaceId: string
  /** Callback to update transform nodes */
  onUpdate: (nodes: TransformNode[]) => void
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
 */
export function AIImageNodeSettings({
  node,
  transformNodes,
  steps,
  workspaceId,
  onUpdate,
}: AIImageNodeSettingsProps) {
  return (
    <div className="space-y-4 border-t px-3 pb-4 pt-4">
      <PromptComposer
        node={node}
        transformNodes={transformNodes}
        steps={steps}
        workspaceId={workspaceId}
        onUpdate={onUpdate}
      />
    </div>
  )
}
