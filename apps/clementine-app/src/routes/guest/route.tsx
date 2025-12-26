import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/guest')({
  component: GuestLayout,
})

function GuestLayout() {
  // Guest area has no sidebar - just render the content
  return <Outlet />
}
