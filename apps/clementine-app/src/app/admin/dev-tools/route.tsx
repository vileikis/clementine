import { createFileRoute } from '@tanstack/react-router'
import { DevTools } from '@/domains/dev-tools/DevTools'

/**
 * Route: /admin/dev-tools
 *
 * Dev tools layout route with tabbed navigation
 */
export const Route = createFileRoute('/admin/dev-tools')({
  component: DevTools,
})
