import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/domains/auth/components/LoginPage'
import { redirectIfAdmin } from '@/domains/auth/lib/guards'

// T035: Create login route file
// T038: Implement redirect logic: admin users to /admin, non-admin users stay on /login
// Updated for server-side auth validation (T124)

export const Route = createFileRoute('/login/')({
  beforeLoad: async () => {
    // Redirect if user is already admin (server-side check)
    await redirectIfAdmin()
  },
  component: LoginPage,
})
