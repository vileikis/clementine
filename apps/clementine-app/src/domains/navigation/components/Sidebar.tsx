import { LogOut, Menu } from 'lucide-react'
import { useParams } from '@tanstack/react-router'
import { signOut } from 'firebase/auth'
import { useServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useSidebarState } from '../hooks'
import { AdminNav } from './AdminNav'
import { WorkspaceNav } from './WorkspaceNav'
import type { RouteArea } from '../types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/ui-kit/components/button'
import { Sheet, SheetContent, SheetTrigger } from '@/ui-kit/components/sheet'
import { logoutFn } from '@/domains/auth/server/functions'
import { auth } from '@/integrations/firebase/client'

const SIDEBAR_WIDTH = {
  expanded: 256, // 16rem / w-64
  collapsed: 64, // 4rem / w-16
}
const SIDEBAR_ANIMATION_DURATION = 200 // ms

interface SidebarProps {
  area: RouteArea
}

export function Sidebar({ area }: SidebarProps) {
  // Get workspaceId from route params if in workspace area
  const params = useParams({ strict: false })
  const workspaceId = 'workspaceId' in params ? params.workspaceId : undefined
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    toggleMobileOpen,
    closeMobile,
  } = useSidebarState()

  if (area === 'guest') {
    return null
  }

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={toggleMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-background border-r">
            <SidebarContent
              area={area}
              workspaceId={workspaceId}
              isCollapsed={false}
              onNavigate={closeMobile}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Collapsible sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:h-screen md:bg-background md:border-r md:shrink-0',
          'transition-[width] ease-out',
        )}
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded,
          transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
        }}
      >
        {/* Hamburger toggle */}
        <div className="px-2 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-11 w-11"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <SidebarContent
          area={area}
          workspaceId={workspaceId}
          isCollapsed={isCollapsed}
        />
      </aside>
    </>
  )
}

interface SidebarContentProps {
  area: RouteArea
  workspaceId?: string
  isCollapsed: boolean
  onNavigate?: () => void
}

function SidebarContent({
  area,
  workspaceId,
  isCollapsed,
}: SidebarContentProps) {
  const serverLogout = useServerFn(logoutFn)

  const handleLogout = async () => {
    try {
      // Sign out from Firebase (client-side)
      await signOut(auth)
      // Clear server session and redirect to /login
      await serverLogout()
    } catch (err) {
      Sentry.captureException(err, {
        tags: { component: 'Sidebar', action: 'logout' },
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation content */}
      <div className="flex-1 px-2">
        {area === 'admin' && <AdminNav isCollapsed={isCollapsed} />}
        {area === 'workspace' && workspaceId && (
          <WorkspaceNav workspaceId={workspaceId} isCollapsed={isCollapsed} />
        )}
      </div>

      {/* Logout button */}
      <div className="px-2 py-3">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3',
            isCollapsed && 'justify-center',
          )}
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}
