import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/join/$projectId/experience/$experienceId')({
  component: JoinExperiencePage,
})

function JoinExperiencePage() {
  const { projectId, experienceId } = Route.useParams()

  // Placeholder - will be replaced with ExperiencePlaceholder in Phase 4
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Experience</h1>
        <p className="text-muted-foreground mt-2">Project ID: {projectId}</p>
        <p className="text-muted-foreground">Experience ID: {experienceId}</p>
      </div>
    </div>
  )
}
