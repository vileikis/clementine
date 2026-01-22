import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/join')({
  component: JoinLayout,
})

function JoinLayout() {
  // Guest join area has no sidebar - just render the content
  return <Outlet />
}
