/**
 * PromptPreview Component
 *
 * Displays the resolved prompt text with all variable and media references substituted.
 * Shows character count, highlights unresolved references, and provides copy-to-clipboard.
 *
 * T029-T038: Live Prompt Resolution (User Story 2)
 */

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { ResolvedPrompt } from '../types'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

interface PromptPreviewProps {
  resolvedPrompt: ResolvedPrompt
  className?: string
}

/**
 * Displays resolved prompt with visual distinction for unresolved references.
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * Features:
 * - Character count display
 * - Monospace font for better readability
 * - Highlights unresolved references in red
 * - Copy-to-clipboard button
 * - Scrollable container for long prompts
 * - Empty state when no content
 *
 * @example
 * ```tsx
 * <PromptPreview
 *   resolvedPrompt={resolvedPrompt}
 * />
 * ```
 */
export function PromptPreview({
  resolvedPrompt,
  className,
}: PromptPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resolvedPrompt.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Empty state when no prompt content
  if (!resolvedPrompt.text || resolvedPrompt.text.trim().length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-muted-foreground">
          No prompt template content
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Add a prompt template in the Edit tab to see the resolved prompt here.
        </p>
      </div>
    )
  }

  // Render resolved prompt with unresolved references highlighted
  const renderPromptText = () => {
    // If no unresolved refs, just return the text
    if (!resolvedPrompt.hasUnresolved) {
      return <span className="whitespace-pre-wrap">{resolvedPrompt.text}</span>
    }

    // Split text to highlight unresolved references
    // Pattern matches: [Undefined: name], [No value: name], [No mapping: name], [Image: name (missing)], [Media: name (missing)]
    const unresolvedPattern =
      /\[(Undefined|No value|No mapping|Image|Media): ([^\]]+?)( \(missing\))?\]/g
    const parts = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = unresolvedPattern.exec(resolvedPrompt.text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {resolvedPrompt.text.slice(lastIndex, match.index)}
          </span>,
        )
      }

      // Add highlighted unresolved reference
      parts.push(
        <span
          key={`unresolved-${match.index}`}
          className="text-destructive line-through whitespace-pre-wrap"
          title="Unresolved reference"
        >
          {match[0]}
        </span>,
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < resolvedPrompt.text.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {resolvedPrompt.text.slice(lastIndex)}
        </span>,
      )
    }

    return <>{parts}</>
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with character count and copy button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {resolvedPrompt.characterCount} characters
          {resolvedPrompt.hasUnresolved && (
            <span className="ml-2 text-destructive">
              • {resolvedPrompt.unresolvedRefs.length} unresolved reference
              {resolvedPrompt.unresolvedRefs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="size-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Resolved prompt text */}
      <div className="max-h-96 overflow-y-auto rounded border border-border bg-muted/50 p-4">
        <div className="font-mono text-sm leading-relaxed">
          {renderPromptText()}
        </div>
      </div>
    </div>
  )
}
