import { createFileRoute } from '@tanstack/react-router'
import { GuestExperiencePage } from '@/domains/guest'

export const Route = createFileRoute('/guest/$projectId')({
  component: GuestProjectPage,
})

function GuestProjectPage() {
  const { projectId } = Route.useParams()
  return <GuestExperiencePage projectId={projectId} />
}
