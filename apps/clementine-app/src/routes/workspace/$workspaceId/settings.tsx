import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceId/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-50">WIP</h1>
    </div>
  )
}
