import { Briefcase, Wrench } from 'lucide-react'
import { NavigationLink } from './NavigationLink'
import type { NavItem } from '../types'

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
      {adminNavItems.map((item) => (
        <NavigationLink
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  )
}
