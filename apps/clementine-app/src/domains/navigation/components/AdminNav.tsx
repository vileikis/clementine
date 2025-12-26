import { Briefcase, Wrench } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { NavItem } from '../types'

const adminNavItems: NavItem[] = [
  { label: 'Workspaces', href: '/admin/workspaces', icon: Briefcase },
  { label: 'Dev Tools', href: '/admin/dev-tools', icon: Wrench },
]

export function AdminNav() {
  return (
    <nav className="flex flex-col gap-2">
      {adminNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-4 py-3 text-slate-50 hover:bg-slate-800 active:bg-slate-700 rounded-md transition-colors"
            activeProps={{ className: 'bg-slate-800' }}
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
