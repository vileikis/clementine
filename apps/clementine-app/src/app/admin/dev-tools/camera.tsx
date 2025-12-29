import { createFileRoute } from '@tanstack/react-router'

/**
 * Route: /admin/dev-tools/camera
 *
 * Camera dev tools testing interface (work in progress)
 */
export const Route = createFileRoute('/admin/dev-tools/camera')({
  component: CameraDevToolsPage,
})

function CameraDevToolsPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">
          Camera Dev Tools
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Work in progress - Coming soon
        </p>
      </div>
    </div>
  )
}
