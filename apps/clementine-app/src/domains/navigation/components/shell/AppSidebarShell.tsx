import { Menu } from 'lucide-react'
import { useSidebarState } from '../../hooks'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { Button } from '@/ui-kit/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/ui-kit/ui/sheet'

const SIDEBAR_WIDTH = {
  expanded: 256, // 16rem / w-64
  collapsed: 64, // 4rem / w-16
}
const SIDEBAR_ANIMATION_DURATION = 200 // ms

interface AppSidebarShellProps {
  children: ReactNode
}

export function AppSidebarShell({ children }: AppSidebarShellProps) {
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    toggleMobileOpen,
    closeMobile,
  } = useSidebarState()

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
          <SheetContent
            side="left"
            className="w-64 bg-background border-r [&>button]:hidden"
          >
            {/* Visually hidden title and description for screen readers */}
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate through workspaces, projects, and settings
            </SheetDescription>

            {/* Hamburger menu close button */}
            <div className="px-2 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobile}
                className="h-11 w-11"
                aria-label="Close navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {children}
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

        {children}
      </aside>
    </>
  )
}
