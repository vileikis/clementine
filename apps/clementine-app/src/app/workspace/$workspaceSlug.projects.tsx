import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">WIP</h1>
    </div>
  )
}
