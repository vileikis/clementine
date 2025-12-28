import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/dev-tools')({
  component: DevToolsPage,
})

function DevToolsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">WIP</h1>
    </div>
  )
}
