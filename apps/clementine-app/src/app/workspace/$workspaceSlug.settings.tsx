import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { workspaceSlug } = Route.useParams()
  console.log('settings workspaceSlug', workspaceSlug)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">WIP</h1>
    </div>
  )
}
