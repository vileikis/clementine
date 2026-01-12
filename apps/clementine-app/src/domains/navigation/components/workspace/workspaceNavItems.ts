import { FolderOpen, Settings, Sparkles } from 'lucide-react'
import type { NavItem } from '../../types'

export const workspaceNavItems: NavItem[] = [
  {
    label: 'Projects',
    to: '/workspace/$workspaceSlug/projects',
    icon: FolderOpen,
  },
  {
    label: 'Experiences',
    to: '/workspace/$workspaceSlug/experiences',
    icon: Sparkles,
  },
  {
    label: 'Settings',
    to: '/workspace/$workspaceSlug/settings',
    icon: Settings,
  },
]
