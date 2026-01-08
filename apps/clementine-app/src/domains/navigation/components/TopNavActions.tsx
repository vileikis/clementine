import type { LucideIcon } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'

/**
 * Action button configuration for TopNavActions utility component
 */
export interface ActionButton {
  /** Button label text (optional - if not provided, button will be icon-only) */
  label?: string

  /** Icon component to display in button */
  icon: LucideIcon

  /** Click handler function */
  onClick: () => void

  /** Button style variant (defaults to 'ghost') */
  variant?: 'default' | 'outline' | 'ghost'

  /** Accessible label for screen readers (required for icon-only buttons, defaults to label) */
  ariaLabel?: string

  /** Whether button is disabled */
  disabled?: boolean
}

interface TopNavActionsProps {
  actions: ActionButton[]
}

/**
 * TopNavActions Utility Component
 *
 * Renders a list of action buttons with consistent styling.
 * Can be used as a helper in the TopNavBar's `right` prop.
 *
 * @example
 * ```tsx
 * <TopNavBar
 *   breadcrumbs={[...]}
 *   right={
 *     <TopNavActions
 *       actions={[
 *         { label: 'Share', icon: Share2, onClick: handleShare, variant: 'default' }
 *       ]}
 *     />
 *   }
 * />
 * ```
 */
export function TopNavActions({ actions }: TopNavActionsProps) {
  if (actions.length === 0) {
    return null
  }

  return (
    <>
      {actions.map((action, index) => {
        const Icon = action.icon
        const isIconOnly = !action.label
        return (
          <Button
            key={index}
            variant={action.variant ?? 'ghost'}
            size={isIconOnly ? 'icon' : 'sm'}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.ariaLabel ?? action.label}
            className={isIconOnly ? '' : 'gap-2'}
          >
            <Icon className="size-4" />
            {!isIconOnly && (
              <span className="hidden sm:inline">{action.label}</span>
            )}
          </Button>
        )
      })}
    </>
  )
}
