import { AppSidebarShell } from '../shell'
import { LogoutButton, NavigationLink } from '../shared'
import { useSidebarState } from '../../hooks'
import { WorkspaceSelector } from './WorkspaceSelector'
import { workspaceNavItems } from './workspaceNavItems'

interface WorkspaceSidebarProps {
  workspaceSlug: string
}

export function WorkspaceSidebar({ workspaceSlug }: WorkspaceSidebarProps) {
  const { isCollapsed } = useSidebarState()

  return (
    <AppSidebarShell>
      <div className="flex flex-col h-full">
        <div className="flex-1 px-2">
          <WorkspaceSelector
            workspaceSlug={workspaceSlug}
            isCollapsed={isCollapsed}
          />
          <nav className="flex flex-col gap-4 mt-4">
            {workspaceNavItems.map((item) => (
              <NavigationLink
                key={item.to}
                label={item.label}
                to={item.to}
                params={{ workspaceSlug }}
                icon={item.icon}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>
        <div className="px-2 py-3">
          <LogoutButton isCollapsed={isCollapsed} />
        </div>
      </div>
    </AppSidebarShell>
  )
}
