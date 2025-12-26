import { FolderKanban, Settings } from 'lucide-react'
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
    icon: FolderKanban,
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
      <nav className="flex flex-col gap-2">
        {workspaceNavItemsTemplate.map((item) => {
          const Icon = item.icon
          const href = item.href.replace('$workspaceId', workspaceId)
          return (
            <Link
              key={item.label}
              to={href}
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
    </div>
  )
}
