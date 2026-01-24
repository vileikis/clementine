import { TopNavBreadcrumb } from './TopNavBreadcrumb'
import { NavTabs } from './NavTabs'
import type { TabItem } from './NavTabs'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/style-utils'

export interface BreadcrumbItem {
  /** Display text or custom element for the breadcrumb item */
  label: React.ReactNode

  /** Optional href for navigation (if present, item is clickable) */
  href?: string

  /** Optional icon component (typically used for first item) */
  icon?: LucideIcon

  /** Optional separate href for the icon (if present, icon becomes a separate clickable link) */
  iconHref?: string
}

export interface TopNavBarProps {
  /** Array of breadcrumb items to display */
  breadcrumbs: BreadcrumbItem[]

  /** Optional tabs to display in a second row below breadcrumbs */
  tabs?: TabItem[]

  /** Optional custom content to render after breadcrumbs (left side) */
  left?: React.ReactNode

  /** Optional custom content to render on the right side (actions, buttons, etc.) */
  right?: React.ReactNode

  /** Optional additional CSS classes */
  className?: string
}

/**
 * TopNavBar Component
 *
 * Flexible top navigation bar with breadcrumbs and custom content areas.
 * Supports composition pattern for maximum flexibility.
 *
 * @example
 * ```tsx
 * <TopNavBar
 *   breadcrumbs={[
 *     { label: 'Projects', icon: FolderOpen, iconHref: '/projects' },
 *     { label: 'My Project', href: '/projects/123' }
 *   ]}
 *   left={<Badge>New changes</Badge>}
 *   right={
 *     <>
 *       <Button variant="outline">Preview</Button>
 *       <Button>Publish</Button>
 *     </>
 *   }
 * />
 * ```
 */
export function TopNavBar({
  breadcrumbs,
  tabs,
  left,
  right,
  className,
}: TopNavBarProps) {
  const hasTabs = tabs && tabs.length > 0

  return (
    <nav className={cn('flex flex-col border-b bg-background', className)}>
      {/* Row 1: Breadcrumbs + left + right content */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <TopNavBreadcrumb items={breadcrumbs} />
          {left}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>

      {/* Row 2: Tabs (conditional) */}
      {hasTabs && (
        <div className="px-6">
          <NavTabs tabs={tabs} />
        </div>
      )}
    </nav>
  )
}
