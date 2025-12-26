import { FolderOpen, Settings } from 'lucide-react'
import { NavigationLink } from './NavigationLink'
import { WorkspaceSelector } from './WorkspaceSelector'
import type { NavItem } from '../types'

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
          const href = item.href.replace('$workspaceId', workspaceId)
          return (
            <NavigationLink
              key={item.label}
              label={item.label}
              href={href}
              icon={item.icon}
              isCollapsed={isCollapsed}
            />
          )
        })}
      </nav>
    </div>
  )
}
