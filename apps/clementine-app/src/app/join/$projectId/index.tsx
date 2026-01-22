/**
 * Welcome Screen Route
 *
 * Child route of /join/$projectId that renders the welcome screen.
 * GuestContext is available via parent layout (GuestLayout).
 */
import { createFileRoute } from '@tanstack/react-router'
import { WelcomeScreen } from '@/domains/guest'

export const Route = createFileRoute('/join/$projectId/')({
  component: WelcomeScreenRoute,
})

function WelcomeScreenRoute() {
  return <WelcomeScreen />
}
