import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Settings index route — redirects to General tab
 *
 * Route: /workspace/:workspaceSlug/settings/
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/settings/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/settings/general',
      params: { workspaceSlug: params.workspaceSlug },
    })
  },
})
