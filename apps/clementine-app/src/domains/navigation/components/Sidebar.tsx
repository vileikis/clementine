import { LogOut, Menu } from 'lucide-react'
import { useSidebarState } from '../hooks'
import { AdminNav } from './AdminNav'
import { WorkspaceNav } from './WorkspaceNav'
import type { RouteArea } from '../types'
import { Button } from '@/ui-kit/components/button'
import { Sheet, SheetContent, SheetTrigger } from '@/ui-kit/components/sheet'

interface SidebarProps {
  area: RouteArea
  workspaceId?: string
}

export function Sidebar({ area, workspaceId }: SidebarProps) {
  const { isOpen, toggle, close } = useSidebarState()

  if (area === 'guest') {
    return null
  }

  return (
    <>
      {/* Mobile: Sheet */}
      <Sheet open={isOpen} onOpenChange={toggle}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" aria-label="Toggle navigation">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-slate-900 border-slate-700 w-64"
        >
          <SidebarContent
            area={area}
            workspaceId={workspaceId}
            onNavigate={close}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Static sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:bg-slate-900 md:border-l md:border-slate-700">
        <SidebarContent area={area} workspaceId={workspaceId} />
      </aside>
    </>
  )
}

interface SidebarContentProps {
  area: RouteArea
  workspaceId?: string
  onNavigate?: () => void
}

function SidebarContent({ area, workspaceId }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Navigation content */}
      <div className="flex-1">
        {area === 'admin' && <AdminNav />}
        {area === 'workspace' && workspaceId && (
          <WorkspaceNav workspaceId={workspaceId} />
        )}
      </div>

      {/* Logout button (placeholder) */}
      <Button
        variant="ghost"
        className="flex items-center gap-3 w-full justify-start text-slate-50 hover:bg-slate-800"
        onClick={() => {
          console.log('Logout clicked (placeholder)')
        }}
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </Button>
    </div>
  )
}
