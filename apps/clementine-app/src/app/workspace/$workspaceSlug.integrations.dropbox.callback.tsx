/**
 * Dropbox OAuth Callback Route
 *
 * Handles the redirect from Dropbox after user authorizes.
 * Exchanges auth code for tokens, encrypts refresh token,
 * stores integration in workspace, and redirects to Connect tab.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from '@/domains/auth/server/session.server'
import { adminDb } from '@/integrations/firebase/server'
import { encrypt } from '@/domains/project/connect/server/encryption.server'

interface DropboxTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  uid: string
  account_id: string
}

interface DropboxAccountInfo {
  email: string
  name: {
    display_name: string
  }
}

const handleDropboxCallbackFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { code?: string; state?: string; error?: string }) => data,
  )
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'handleDropboxCallbackFn', op: 'dropbox.oauth.callback' },
      async () => {
        const session = await useAppSession()
        const oauthState = session.data.dropboxOAuth

        // User cancelled or Dropbox returned an error
        if (data.error || !data.code) {
          // Clean up session
          if (oauthState) {
            const { dropboxOAuth: _, ...rest } = session.data
            await session.update(rest)
          }
          return {
            redirect: oauthState
              ? `/workspace/${oauthState.workspaceSlug}/projects/${oauthState.projectId}/connect`
              : '/workspace',
          }
        }

        // Validate state matches session
        if (!oauthState || data.state !== oauthState.state) {
          Sentry.captureMessage('Dropbox OAuth state mismatch', {
            level: 'warning',
          })
          const { dropboxOAuth: _, ...rest } = session.data
          await session.update(rest)
          return {
            redirect: oauthState
              ? `/workspace/${oauthState.workspaceSlug}/projects/${oauthState.projectId}/connect?error=invalid_state`
              : '/workspace',
          }
        }

        const { codeVerifier, workspaceId, projectId, workspaceSlug } =
          oauthState

        try {
          // Exchange code for tokens
          const appKey = process.env['VITE_DROPBOX_APP_KEY']
          const appSecret = process.env['DROPBOX_APP_SECRET']

          if (!appKey || !appSecret) {
            throw new Error('Dropbox app credentials not configured')
          }

          const baseUrl =
            process.env.NODE_ENV === 'production'
              ? `https://${process.env['VITE_APP_DOMAIN'] || 'localhost:3000'}`
              : 'http://localhost:3000'

          const redirectUri = `${baseUrl}/workspace/${workspaceSlug}/integrations/dropbox/callback`

          const tokenResponse = await fetch(
            'https://api.dropboxapi.com/oauth2/token',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                code: data.code,
                grant_type: 'authorization_code',
                client_id: appKey,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
              }),
            },
          )

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            throw new Error(`Token exchange failed: ${errorText}`)
          }

          const tokenData = (await tokenResponse.json()) as DropboxTokenResponse

          // Fetch account info
          const accountResponse = await fetch(
            'https://api.dropboxapi.com/2/users/get_current_account',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            },
          )

          if (!accountResponse.ok) {
            throw new Error('Failed to fetch Dropbox account info')
          }

          const accountInfo =
            (await accountResponse.json()) as DropboxAccountInfo

          // Encrypt refresh token
          const encryptedRefreshToken = encrypt(tokenData.refresh_token)

          // Write integration to workspace
          const workspaceRef = adminDb.collection('workspaces').doc(workspaceId)

          await workspaceRef.update({
            'integrations.dropbox': {
              status: 'connected',
              accountEmail: accountInfo.email,
              accountDisplayName: accountInfo.name.display_name,
              encryptedRefreshToken,
              connectedBy: session.data.userId,
              connectedAt: Date.now(),
              scopes: ['app_folder'],
            },
            updatedAt: Date.now(),
          })

          // Clean up OAuth state from session
          const { dropboxOAuth: _, ...rest } = session.data
          await session.update(rest)

          return {
            redirect: `/workspace/${workspaceSlug}/projects/${projectId}/connect?dropbox=connected`,
          }
        } catch (error) {
          Sentry.captureException(error, {
            tags: { action: 'dropbox-oauth-callback' },
          })

          // Clean up session
          const { dropboxOAuth: _, ...rest } = session.data
          await session.update(rest)

          return {
            redirect: `/workspace/${workspaceSlug}/projects/${projectId}/connect?error=oauth_failed`,
          }
        }
      },
    )
  })

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
