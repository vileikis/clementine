import { createFileRoute } from '@tanstack/react-router'
import { WelcomeScreenPage } from '@/domains/guest'

export const Route = createFileRoute('/join/$projectId')({
  component: JoinProjectPage,
})

function JoinProjectPage() {
  const { projectId } = Route.useParams()
  return <WelcomeScreenPage projectId={projectId} />
}
