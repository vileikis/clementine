import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/guest/$projectId')({
  component: GuestProjectPage,
})

function GuestProjectPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-50">WIP</h1>
    </div>
  )
}
