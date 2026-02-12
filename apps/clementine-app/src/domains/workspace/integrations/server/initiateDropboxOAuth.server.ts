/**
 * Initiate Dropbox OAuth flow
 *
 * Generates PKCE challenge, stores verifier in session, returns authorization URL.
 */
import { createHash, randomBytes } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from '@/domains/auth/server/session.server'

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export const initiateDropboxOAuthFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { workspaceId: string; workspaceSlug: string; returnTo: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'initiateDropboxOAuthFn', op: 'dropbox.oauth.initiate' },
      async () => {
        const session = await useAppSession()

        if (!session.data.userId || !session.data.isAdmin) {
          throw new Error('Unauthorized: admin access required')
        }

        const { verifier, challenge } = generatePKCE()
        const state = randomBytes(16).toString('hex')

        // Store PKCE state in session for callback validation
        await session.update({
          ...session.data,
          dropboxOAuth: {
            codeVerifier: verifier,
            state,
            workspaceId: data.workspaceId,
            workspaceSlug: data.workspaceSlug,
            returnTo: data.returnTo,
          },
        })

        const appKey = process.env['VITE_DROPBOX_APP_KEY']
        if (!appKey) {
          throw new Error('VITE_DROPBOX_APP_KEY is not configured')
        }

        // Build callback URL from the workspace slug
        const baseUrl =
          process.env.NODE_ENV === 'production'
            ? `https://${process.env['VITE_APP_DOMAIN'] || 'localhost:3000'}`
            : 'http://localhost:3000'

        const redirectUri = `${baseUrl}/workspace/${data.workspaceSlug}/integrations/dropbox/callback`

        const params = new URLSearchParams({
          client_id: appKey,
          redirect_uri: redirectUri,
          response_type: 'code',
          token_access_type: 'offline',
          scope: 'account_info.read files.metadata.read files.content.write',
          code_challenge: challenge,
          code_challenge_method: 'S256',
          state,
        })

        const authorizationUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`

        return { authorizationUrl }
      },
    )
  })
