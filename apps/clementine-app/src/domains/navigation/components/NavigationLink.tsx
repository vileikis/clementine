import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface NavigationLinkProps {
  label: string
  href: string
  icon?: LucideIcon
  isCollapsed: boolean
}

export function NavigationLink({
  label,
  href,
  icon,
  isCollapsed,
}: NavigationLinkProps) {
  const Icon = icon

  return (
    <Link
      to={href}
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
                isCollapsed && isActive && 'bg-accent text-accent-foreground',
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
              className={cn(isCollapsed ? 'text-xs text-center' : 'text-sm')}
            >
              {label}
            </span>
          </>
        ) : (
          <span className={cn(isCollapsed ? 'text-xs' : 'text-sm')}>
            {label}
          </span>
        )
      }
    </Link>
  )
}
