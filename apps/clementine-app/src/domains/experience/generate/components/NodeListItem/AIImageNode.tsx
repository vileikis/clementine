/**
 * AIImageNode Components
 *
 * Header and Settings components for AI Image nodes.
 * Kept together for maintainability.
 */
import type { AIImageNode } from '@clementine/shared'

export interface AIImageNodeProps {
  /** AI Image node data */
  node: AIImageNode
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
 * Renders the expanded settings panels:
 * - Model Settings
 * - Prompt
 * - Reference Media
 * - Test Run
 */
export function AIImageNodeSettings({ node }: AIImageNodeProps) {
  const { config } = node

  // Truncate prompt for display
  const promptPreview = config.prompt
    ? config.prompt.length > 60
      ? `${config.prompt.slice(0, 60)}...`
      : config.prompt
    : '(No prompt configured)'

  return (
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
          {config.refMedia.length > 0 && ` (${config.refMedia.length} items)`}
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
  )
}
