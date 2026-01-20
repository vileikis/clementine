import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/join/$projectId')({
  component: JoinProjectPage,
})

function JoinProjectPage() {
  const { projectId } = Route.useParams()

  // Placeholder - will be replaced with WelcomeScreenPage in Phase 3
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="text-muted-foreground mt-2">Project ID: {projectId}</p>
      </div>
    </div>
  )
}
