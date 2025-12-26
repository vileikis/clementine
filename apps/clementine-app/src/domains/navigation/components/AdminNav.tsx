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
    <nav className="flex flex-col gap-4">
      {adminNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'group flex transition-all',
              isCollapsed
                ? 'flex-col items-center gap-1'
                : 'flex-row items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground',
            )}
            activeProps={{
              className: isCollapsed ? '' : 'bg-accent text-accent-foreground',
            }}
          >
            {({ isActive }) =>
              Icon ? (
                <>
                  <div
                    className={cn(
                      'flex items-center justify-center transition-all',
                      isCollapsed &&
                        'rounded-md w-10 h-10 hover:bg-accent hover:text-accent-foreground',
                      isCollapsed &&
                        isActive &&
                        'bg-accent text-accent-foreground',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-transform',
                        'group-hover:scale-110',
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      isCollapsed ? 'text-xs text-center' : 'text-sm',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              ) : (
                <span className={cn(isCollapsed ? 'text-xs' : 'text-sm')}>
                  {item.label}
                </span>
              )
            }
          </Link>
        )
      })}
    </nav>
  )
}
