/**
 * Guest Project Layout Route
 *
 * Layout route that wraps all /join/$projectId/* routes with GuestLayout.
 * GuestLayout handles initialization (auth, guest access, guest record)
 * and provides context to child routes.
 */
import { createFileRoute } from '@tanstack/react-router'
import { GuestLayout } from '@/domains/guest'

export const Route = createFileRoute('/join/$projectId')({
  component: GuestLayoutRoute,
})

function GuestLayoutRoute() {
  const { projectId } = Route.useParams()
  return <GuestLayout projectId={projectId} />
}
