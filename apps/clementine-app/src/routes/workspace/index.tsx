import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/')({
  component: () => <Navigate to="/admin" />,
})
