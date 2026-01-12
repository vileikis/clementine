import { AppSidebarShell } from '../shell'
import { LogoutButton, NavigationLink } from '../shared'
import { useSidebarState } from '../../hooks'
import { adminNavItems } from './adminNavItems'

export function AdminSidebar() {
  const { isCollapsed } = useSidebarState()

  return (
    <AppSidebarShell>
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-2 flex flex-col gap-4">
          {adminNavItems.map((item) => (
            <NavigationLink
              key={item.to}
              label={item.label}
              to={item.to}
              icon={item.icon}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
        <div className="px-2 py-3">
          <LogoutButton isCollapsed={isCollapsed} />
        </div>
      </div>
    </AppSidebarShell>
  )
}
