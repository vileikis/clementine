/**
 * Disconnect Dropbox from workspace
 *
 * Revokes the token via Dropbox API and clears the integration from Firestore.
 */
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from '@/domains/auth/server/session.server'
import { adminDb } from '@/integrations/firebase/server'
import { decrypt } from '@/server/encryption.server'

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
