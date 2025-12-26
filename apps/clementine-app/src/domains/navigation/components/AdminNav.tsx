import { Briefcase, Wrench } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { NavItem } from '../types'
import { cn } from '@/shared/lib/utils'

const adminNavItems: NavItem[] = [
  { label: 'Workspaces', href: '/admin/workspaces', icon: Briefcase },
  { label: 'Dev Tools', href: '/admin/dev-tools', icon: Wrench },
]

interface AdminNavProps {
  isCollapsed: boolean
}

export function AdminNav({ isCollapsed }: AdminNavProps) {
  return (
    <nav className="flex flex-col gap-2">
      {adminNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isCollapsed && 'justify-center px-2',
            )}
            activeProps={{
              className: 'bg-accent text-accent-foreground',
            }}
            title={isCollapsed ? item.label : undefined}
          >
            {Icon && <Icon className="w-5 h-5 shrink-0" />}
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
