import { Briefcase, Wrench } from 'lucide-react'
import type { NavItem } from '../../types'

export const adminNavItems: NavItem[] = [
  { label: 'Workspaces', to: '/admin/workspaces', icon: Briefcase },
  { label: 'Dev Tools', to: '/admin/dev-tools', icon: Wrench },
]
