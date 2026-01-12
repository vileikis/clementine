import { FolderOpen, Settings } from 'lucide-react'
import type { NavItem } from '../../types'

export const workspaceNavItems: NavItem[] = [
  {
    label: 'Projects',
    to: '/workspace/$workspaceSlug/projects',
    icon: FolderOpen,
  },
  {
    label: 'Settings',
    to: '/workspace/$workspaceSlug/settings',
    icon: Settings,
  },
]
