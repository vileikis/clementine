import { Link, createFileRoute } from '@tanstack/react-router'
import { handleRootRoute } from '@/domains/auth/guards'

export const Route = createFileRoute('/')({
  beforeLoad: handleRootRoute,
  component: RootPage,
})

function RootPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">Welcome to Clementine</h1>
        <p className="text-muted-foreground">
          Looking for a project experience? Use the link provided by your event
          organizer.
        </p>
        <div className="pt-4">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  )
}
