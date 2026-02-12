/**
 * Dropbox OAuth Server Functions
 *
 * Server functions for OAuth connect/disconnect flows.
 * These require server-side secrets (DROPBOX_APP_SECRET, encryption key).
 */
import { createHash, randomBytes } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from '@/domains/auth/server/session.server'
import { adminDb } from '@/integrations/firebase/server'

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

/**
 * Initiate Dropbox OAuth flow
 *
 * Generates PKCE challenge, stores verifier in session, returns authorization URL.
 */
export const initiateDropboxOAuthFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { workspaceId: string; projectId: string; workspaceSlug: string }) =>
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
            projectId: data.projectId,
            workspaceSlug: data.workspaceSlug,
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

/**
 * Disconnect Dropbox from workspace
 *
 * Revokes the token via Dropbox API and clears the integration from Firestore.
 */
export const disconnectDropboxFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { workspaceId: string }) => data)
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'disconnectDropboxFn', op: 'dropbox.oauth.disconnect' },
      async () => {
        const session = await useAppSession()

        if (!session.data.userId || !session.data.isAdmin) {
          throw new Error('Unauthorized: admin access required')
        }

        const workspaceRef = adminDb
          .collection('workspaces')
          .doc(data.workspaceId)
        const workspaceDoc = await workspaceRef.get()
        const integration =
          workspaceDoc.data()?.['integrations']?.['dropbox'] ?? null

        if (integration && integration.encryptedRefreshToken) {
          // Decrypt and revoke the token
          try {
            const { decrypt } =
              await import('@/domains/project/connect/server/encryption.server')
            const refreshToken = decrypt(integration.encryptedRefreshToken)

            // Best-effort revoke — if the token is already invalid, that's fine
            const accessToken = await refreshAccessToken(refreshToken)
            if (accessToken) {
              await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
              })
            }
          } catch (error) {
            // Log but don't fail — token may already be invalid
            Sentry.captureException(error, {
              tags: { action: 'dropbox-token-revoke' },
              level: 'warning',
            })
          }
        }

        // Clear integration from workspace
        await workspaceRef.update({
          'integrations.dropbox': null,
          updatedAt: Date.now(),
        })

        return { success: true }
      },
    )
  })

/**
 * Refresh a Dropbox access token using a refresh token
 * Returns the access token or null if refresh fails
 */
async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  const appKey = process.env['VITE_DROPBOX_APP_KEY']
  const appSecret = process.env['DROPBOX_APP_SECRET']

  if (!appKey || !appSecret) return null

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }),
  })

  if (!response.ok) return null

  const tokenData = (await response.json()) as { access_token: string }
  return tokenData.access_token
}
