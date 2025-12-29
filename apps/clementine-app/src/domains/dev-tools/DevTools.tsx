'use client'

import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { cn } from '@/shared/utils'

/**
 * DevTools Layout Container
 *
 * Main layout component for development tools interface
 * Provides tabbed navigation between different dev tool modules
 */
export function DevTools() {
  const matchRoute = useMatchRoute()
  const isPreviewShellActive = matchRoute({
    to: '/admin/dev-tools/preview-shell',
  })
  const isCameraActive = matchRoute({ to: '/admin/dev-tools/camera' })

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Dev Tools</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b px-6">
          <Link
            to="/admin/dev-tools/preview-shell"
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              isPreviewShellActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Preview Shell
            {isPreviewShellActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </Link>
          <Link
            to="/admin/dev-tools/camera"
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              isCameraActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Camera <span className="ml-1 text-xs">(WIP)</span>
            {isCameraActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
