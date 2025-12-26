import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/guest/')({
  component: GuestNotFound,
})

function GuestNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground">Project not found</p>
      </div>
    </div>
  )
}
