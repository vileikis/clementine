/**
 * NavTabs Component
 *
 * Horizontal navigation tabs for route-based navigation.
 * Uses TanStack Router Link with activeProps/inactiveProps for styling.
 */
import { Link, useParams } from '@tanstack/react-router'
import { cn } from '@/shared/utils/style-utils'

// ============================================================================
// Types
// ============================================================================

export interface TabItem {
  /** Unique identifier for the tab */
  id: string
  /** Display label shown to users */
  label: string
  /** TanStack Router path pattern (e.g., '/workspace/$workspaceSlug/...') */
  to: string
}

export interface NavTabsProps {
  /** Array of tab items to render */
  tabs: TabItem[]
  /** Optional additional CSS classes */
  className?: string
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * NavTabs component
 *
 * Renders horizontal navigation tabs with active state detection.
 * Uses TanStack Router Link with activeProps/inactiveProps for styling.
 *
 * @example
 * ```tsx
 * const tabs: TabItem[] = [
 *   { id: 'welcome', label: 'Welcome', to: '/workspace/$workspaceSlug/.../welcome' },
 *   { id: 'theme', label: 'Theme', to: '/workspace/$workspaceSlug/.../theme' },
 * ]
 *
 * <NavTabs tabs={tabs} />
 * ```
 */
export function NavTabs({ tabs, className }: NavTabsProps) {
  const params = useParams({ strict: false })

  return (
    <nav className={cn('flex gap-1', className)}>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          params={params}
          className="px-3 py-2 text-sm font-medium transition-colors"
          activeProps={{
            className: 'text-foreground border-b-2 border-primary',
          }}
          inactiveProps={{
            className: 'text-muted-foreground hover:text-foreground',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
