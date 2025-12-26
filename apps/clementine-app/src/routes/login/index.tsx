import { createFileRoute, redirect } from '@tanstack/react-router'
import type { MyRouterContext } from '../__root'
import { LoginPage } from '@/domains/auth/components/LoginPage'

// T035: Create login route file
// T038: Implement redirect logic: admin users to /admin, non-admin users stay on /login

export const Route = createFileRoute('/login/')({
  beforeLoad: ({ context }: { context: MyRouterContext }) => {
    const { auth } = context

    if (!auth) {
      throw new Error('Auth not available in context')
    }

    // Wait for auth to initialize
    if (auth.isLoading) {
      return
    }

    // If user is already admin, redirect to admin
    if (auth.user && !auth.isAnonymous && auth.isAdmin) {
      throw redirect({ to: '/admin' as const })
    }

    // Non-admin users or anonymous users stay on login page
    return
  },
  component: LoginPage,
})
