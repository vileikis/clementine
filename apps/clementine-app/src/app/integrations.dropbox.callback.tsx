/**
 * Dropbox OAuth Callback Route
 *
 * Fixed callback path for all Dropbox OAuth flows.
 * Workspace context is stored in the session, not the URL.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import { handleDropboxCallbackFn } from '@/domains/workspace/integrations/server'

export const Route = createFileRoute('/integrations/dropbox/callback')({
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
