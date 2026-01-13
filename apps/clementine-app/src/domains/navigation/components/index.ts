// Barrel export for navigation components

// Shell (generic)
export { AppSidebarShell } from './shell'

// Area-specific sidebars
export { AdminSidebar } from './admin'
export { WorkspaceSidebar, WorkspaceSelector } from './workspace'

// Shared components
export { NavigationLink, LogoutButton } from './shared'

// Top navigation
export { TopNavBar } from './TopNavBar'
export type { BreadcrumbItem, TopNavBarProps } from './TopNavBar'
export { TopNavActions } from './TopNavActions'
export type { ActionButton } from './TopNavActions'
export { NavTabs } from './NavTabs'
export type { TabItem, NavTabsProps } from './NavTabs'
