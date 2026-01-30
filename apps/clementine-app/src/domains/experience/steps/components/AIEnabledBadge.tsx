/**
 * AIEnabledBadge Component
 *
 * Visual indicator that AI context has been added to a step or option.
 * Shows a sparkle emoji with "AI context added" text.
 */

interface AIEnabledBadgeProps {
  /** Optional CSS classes */
  className?: string
}

/**
 * Badge indicating AI context is present
 *
 * Used to show that AI-specific fields (promptFragment, promptMedia, etc.)
 * have been configured for a step or option.
 *
 * @example
 * ```tsx
 * {hasAIContext && <AIEnabledBadge />}
 * ```
 */
export function AIEnabledBadge({ className }: AIEnabledBadgeProps) {
  return (
    <div className={className ?? 'pb-3 text-xs text-muted-foreground'}>
      ✨ AI context added
    </div>
  )
}
