import { TopNavBreadcrumb } from './TopNavBreadcrumb'
import { TopNavActions } from './TopNavActions'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/style-utils'

export interface BreadcrumbItem {
  /** Display text for the breadcrumb item */
  label: string

  /** Optional href for navigation (if present, item is clickable) */
  href?: string

  /** Optional icon component (typically used for first item) */
  icon?: LucideIcon
}

export interface ActionButton {
  /** Button label text */
  label: string

  /** Icon component to display in button */
  icon: LucideIcon

  /** Click handler function */
  onClick: () => void

  /** Button style variant (defaults to 'ghost') */
  variant?: 'default' | 'outline' | 'ghost'

  /** Accessible label for screen readers (defaults to label) */
  ariaLabel?: string
}

export interface TopNavBarProps {
  /** Array of breadcrumb items to display (left side) */
  breadcrumbs: BreadcrumbItem[]

  /** Array of action buttons to display (right side) */
  actions: ActionButton[]

  /** Optional additional CSS classes */
  className?: string
}

export function TopNavBar({ breadcrumbs, actions, className }: TopNavBarProps) {
  return (
    <nav
      className={cn(
        'flex items-center justify-between border-b bg-background px-4 py-3',
        className,
      )}
    >
      <TopNavBreadcrumb items={breadcrumbs} />
      <TopNavActions actions={actions} />
    </nav>
  )
}
