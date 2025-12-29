import { FolderOpen, Settings } from 'lucide-react'
import { NavigationLink } from './NavigationLink'
import { WorkspaceSelector } from './WorkspaceSelector'
import type { NavItem } from '../types'

interface WorkspaceNavProps {
  workspaceSlug: string
  isCollapsed: boolean
}

const workspaceNavItemsTemplate: NavItem[] = [
  {
    label: 'Projects',
    href: '/workspace/$workspaceSlug/projects',
    icon: FolderOpen,
  },
  {
    label: 'Settings',
    href: '/workspace/$workspaceSlug/settings',
    icon: Settings,
  },
]

export function WorkspaceNav({
  workspaceSlug,
  isCollapsed,
}: WorkspaceNavProps) {
  return (
    <div className="flex flex-col gap-4">
      <WorkspaceSelector
        workspaceSlug={workspaceSlug}
        isCollapsed={isCollapsed}
      />
      <nav className="flex flex-col gap-4">
        {workspaceNavItemsTemplate.map((item) => {
          const href = item.href.replace('$workspaceSlug', workspaceSlug)
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
