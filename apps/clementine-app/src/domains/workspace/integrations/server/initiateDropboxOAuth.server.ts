/**
 * Initiate Dropbox OAuth flow
 *
 * Generates PKCE challenge, stores verifier in session, returns authorization URL.
 */
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from '@/domains/auth/server/session.server'

const initiateDropboxOAuthInputSchema = z.object({
  workspaceId: z.string().min(1),
  returnTo: z.string().min(1),
})

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export const initiateDropboxOAuthFn = createServerFn({ method: 'POST' })
  .inputValidator(initiateDropboxOAuthInputSchema)
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
            returnTo: data.returnTo,
          },
        })

        const appKey = process.env['VITE_DROPBOX_APP_KEY']
        if (!appKey) {
          throw new Error('VITE_DROPBOX_APP_KEY is not configured')
        }

        // Build fixed callback URL (workspace context stored in session)
        const appDomain = process.env['VITE_APP_DOMAIN']
        if (process.env.NODE_ENV === 'production' && !appDomain) {
          throw new Error('VITE_APP_DOMAIN must be set in production')
        }
        const baseUrl = appDomain
          ? `https://${appDomain}`
          : 'http://localhost:3000'

        const redirectUri = `${baseUrl}/integrations/dropbox/callback`

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
