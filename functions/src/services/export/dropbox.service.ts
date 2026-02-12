/**
 * Dropbox API Service
 *
 * HTTP-based Dropbox API client for token refresh and file upload.
 * No SDK dependency — uses native fetch with Dropbox HTTP API.
 */
import { logger } from 'firebase-functions/v2'

/**
 * Error thrown when the refresh token is invalid (revoked or expired).
 * Signals that the workspace integration needs re-authentication.
 */
export class DropboxInvalidGrantError extends Error {
  constructor() {
    super('Dropbox refresh token is invalid (invalid_grant)')
    this.name = 'DropboxInvalidGrantError'
  }
}

/**
 * Error thrown when Dropbox reports insufficient storage space.
 */
export class DropboxInsufficientSpaceError extends Error {
  constructor() {
    super('Dropbox account has insufficient storage space')
    this.name = 'DropboxInsufficientSpaceError'
  }
}

/**
 * Refresh a Dropbox access token using a refresh token.
 *
 * @param refreshToken - Decrypted Dropbox refresh token
 * @param appKey - Dropbox app key (client ID)
 * @param appSecret - Dropbox app secret
 * @returns Fresh short-lived access token
 * @throws DropboxInvalidGrantError if the refresh token is revoked/expired
 * @throws Error for other API failures
 */
export async function refreshAccessToken(
  refreshToken: string,
  appKey: string,
  appSecret: string,
): Promise<string> {
  const tokenController = new AbortController()
  const tokenTimeout = setTimeout(() => tokenController.abort(), 30_000)
  let response: Response
  try {
    response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: appKey,
        client_secret: appSecret,
      }),
      signal: tokenController.signal,
    })
  } catch (error) {
    clearTimeout(tokenTimeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Dropbox token refresh timed out after 30s')
    }
    throw error
  }
  clearTimeout(tokenTimeout)

  if (!response.ok) {
    const errorBody = await response.text()
    logger.error('[DropboxService] Token refresh failed', {
      status: response.status,
      body: errorBody,
    })

    if (response.status === 400 && errorBody.includes('invalid_grant')) {
      throw new DropboxInvalidGrantError()
    }

    throw new Error(`Dropbox token refresh failed: ${response.status}`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

/**
 * Upload a file to Dropbox using the /files/upload API.
 *
 * Uses "overwrite" mode for idempotent retries.
 * Max file size: 150MB (single request upload).
 *
 * @param accessToken - Valid Dropbox access token
 * @param path - Destination path in Dropbox (e.g., "/ProjectName/ExperienceName/file.jpg")
 * @param content - File content as Buffer
 */
export async function uploadFile(
  accessToken: string,
  path: string,
  content: Buffer,
): Promise<void> {
  const uploadController = new AbortController()
  const uploadTimeout = setTimeout(() => uploadController.abort(), 120_000)
  let response: Response
  try {
    response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'overwrite',
          autorename: false,
          mute: true,
        }),
      },
      body: content,
      signal: uploadController.signal,
    })
  } catch (error) {
    clearTimeout(uploadTimeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Dropbox file upload timed out after 120s')
    }
    throw error
  }
  clearTimeout(uploadTimeout)

  if (!response.ok) {
    const errorBody = await response.text()
    logger.error('[DropboxService] File upload failed', {
      status: response.status,
      path,
      body: errorBody,
    })

    if (response.status === 409 && errorBody.includes('insufficient_space')) {
      throw new DropboxInsufficientSpaceError()
    }

    throw new Error(`Dropbox upload failed: ${response.status}`)
  }
}
