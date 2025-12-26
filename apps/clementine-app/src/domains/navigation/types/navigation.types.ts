import type { LucideIcon } from 'lucide-react'

export interface Workspace {
  id: string
  name: string
}

export type RouteArea = 'admin' | 'workspace' | 'guest'

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
}
