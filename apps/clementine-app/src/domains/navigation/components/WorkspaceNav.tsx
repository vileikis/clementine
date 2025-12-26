import { FolderOpen, Settings } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { WorkspaceSelector } from './WorkspaceSelector'
import type { NavItem } from '../types'
import { cn } from '@/shared/lib/utils'

interface WorkspaceNavProps {
  workspaceId: string
  isCollapsed: boolean
}

const workspaceNavItemsTemplate: NavItem[] = [
  {
    label: 'Projects',
    href: '/workspace/$workspaceId/projects',
    icon: FolderOpen,
  },
  {
    label: 'Settings',
    href: '/workspace/$workspaceId/settings',
    icon: Settings,
  },
]

export function WorkspaceNav({ workspaceId, isCollapsed }: WorkspaceNavProps) {
  return (
    <div className="flex flex-col gap-4">
      <WorkspaceSelector workspaceId={workspaceId} isCollapsed={isCollapsed} />
      <nav className="flex flex-col gap-4">
        {workspaceNavItemsTemplate.map((item) => {
          const Icon = item.icon
          const href = item.href.replace('$workspaceId', workspaceId)
          return (
            <Link
              key={item.label}
              to={href}
              className={cn(
                'group flex transition-all',
                isCollapsed
                  ? 'flex-col items-center gap-1'
                  : 'flex-row items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground',
              )}
              activeProps={{
                className: isCollapsed
                  ? ''
                  : 'bg-accent text-accent-foreground',
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
    </div>
  )
}
