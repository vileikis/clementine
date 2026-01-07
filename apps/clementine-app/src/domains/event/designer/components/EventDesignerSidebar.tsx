/**
 * EventDesignerSidebar Component
 *
 * Composable sidebar navigation for the event designer.
 * Supports simple links, sections with nested items, and optional action icons.
 */
import { Link, useMatchRoute, useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

// ============================================================================
// Types
// ============================================================================

interface SidebarLinkItem {
  type: 'link'
  id: string
  label: string
  to: string
}

interface SidebarSectionItem {
  type: 'section'
  id: string
  label: string
  action?: {
    icon: ReactNode
    onClick: () => void
    ariaLabel: string
  }
  items: Array<{
    id: string
    label: string
    to: string
  }>
}

export type SidebarItem = SidebarLinkItem | SidebarSectionItem

interface EventDesignerSidebarProps {
  items: SidebarItem[]
}

// ============================================================================
// Subcomponents (internal)
// ============================================================================

interface SidebarLinkProps {
  to: string
  params: Record<string, string>
  isActive: boolean
  children: ReactNode
}

function SidebarLink({ to, params, isActive, children }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(
        'block px-3 py-1.5 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}

interface SidebarSectionProps {
  label: string
  action?: {
    icon: ReactNode
    onClick: () => void
    ariaLabel: string
  }
  children: ReactNode
}

function SidebarSection({ label, action, children }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            aria-label={action.ariaLabel}
            className="p-0.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            {action.icon}
          </button>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

interface SidebarSectionItemProps {
  to: string
  params: Record<string, string>
  isActive: boolean
  children: ReactNode
}

function SidebarSectionItem({
  to,
  params,
  isActive,
  children,
}: SidebarSectionItemProps) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(
        'block px-3 py-1.5 pl-6 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function EventDesignerSidebar({ items }: EventDesignerSidebarProps) {
  const matchRoute = useMatchRoute()
  const { workspaceSlug, projectId, eventId } = useParams({
    from: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
  })

  const params = { workspaceSlug, projectId, eventId }

  return (
    <aside className="w-48 border-r">
      <nav className="flex flex-col gap-3 p-2">
        {items.map((item) => {
          if (item.type === 'link') {
            const isActive = !!matchRoute({ to: item.to })
            return (
              <SidebarLink
                key={item.id}
                to={item.to}
                params={params}
                isActive={isActive}
              >
                {item.label}
              </SidebarLink>
            )
          }

          // Section with nested items
          return (
            <SidebarSection
              key={item.id}
              label={item.label}
              action={item.action}
            >
              {item.items.map((subItem) => {
                const isActive = !!matchRoute({ to: subItem.to })
                return (
                  <SidebarSectionItem
                    key={subItem.id}
                    to={subItem.to}
                    params={params}
                    isActive={isActive}
                  >
                    {subItem.label}
                  </SidebarSectionItem>
                )
              })}
            </SidebarSection>
          )
        })}
      </nav>
    </aside>
  )
}
