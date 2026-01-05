import { TopNavBreadcrumb } from './TopNavBreadcrumb'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/style-utils'

export interface BreadcrumbItem {
  /** Display text for the breadcrumb item */
  label: string

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
  left,
  right,
  className,
}: TopNavBarProps) {
  return (
    <nav
      className={cn(
        'flex h-16 items-center justify-between border-b bg-background px-6',
        className,
      )}
    >
      {/* Left side: breadcrumbs + custom content */}
      <div className="flex items-center gap-2">
        <TopNavBreadcrumb items={breadcrumbs} />
        {left}
      </div>

      {/* Right side: custom content */}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </nav>
  )
}
