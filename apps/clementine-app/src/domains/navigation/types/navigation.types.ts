import type { LucideIcon } from 'lucide-react'

export interface Workspace {
  id: string
  name: string
}

export interface NavItem {
  label: string
  to: string
  icon?: LucideIcon
}
