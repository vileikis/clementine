import { FolderKanban, Settings } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { WorkspaceSelector } from './WorkspaceSelector'
import type { NavItem } from '../types'

interface WorkspaceNavProps {
  workspaceId: string
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

export function WorkspaceNav({ workspaceId }: WorkspaceNavProps) {
  return (
    <div className="flex flex-col gap-4">
      <WorkspaceSelector workspaceId={workspaceId} />
      <nav className="flex flex-col gap-2">
        {workspaceNavItemsTemplate.map((item) => {
          const Icon = item.icon
          const href = item.href.replace('$workspaceId', workspaceId)
          return (
            <Link
              key={item.label}
              to={href}
              className="flex items-center gap-3 px-4 py-3 text-slate-50 hover:bg-slate-800 active:bg-slate-700 rounded-md transition-colors"
              activeProps={{ className: 'bg-slate-800' }}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
