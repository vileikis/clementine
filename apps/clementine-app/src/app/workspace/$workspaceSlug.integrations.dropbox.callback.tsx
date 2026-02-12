/**
 * Dropbox OAuth Callback Route
 *
 * Thin route that delegates to the workspace integrations server function.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import { handleDropboxCallbackFn } from '@/domains/workspace/integrations/server'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/integrations/dropbox/callback',
)({
  beforeLoad: async ({ search }) => {
    const params = search as Record<string, string | undefined>
    const result = await handleDropboxCallbackFn({
      data: {
        code: params['code'],
        state: params['state'],
        error: params['error'],
      },
    })

    throw redirect({ to: result.redirect })
  },
  component: () => null,
})
