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

/** Chunk size for large file uploads: 8MB */
const CHUNK_SIZE = 8 * 1024 * 1024

/**
 * Upload a large file to Dropbox using the Upload Session API.
 *
 * Splits the file into 8MB chunks and uploads via:
 * upload_session/start → upload_session/append_v2 (repeated) → upload_session/finish
 *
 * Use for files > 150MB (up to 500MB).
 *
 * @param accessToken - Valid Dropbox access token
 * @param path - Destination path in Dropbox
 * @param buffer - File content as Buffer
 * @param totalSize - Total file size in bytes (for logging)
 */
export async function uploadLargeFile(
  accessToken: string,
  path: string,
  buffer: Buffer,
  totalSize: number,
): Promise<void> {
  const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE)

  logger.info('[DropboxService] Starting chunked upload', {
    path,
    totalSize,
    totalChunks,
  })

  // 1. Start session with first chunk
  const firstChunk = buffer.subarray(0, CHUNK_SIZE)
  const sessionId = await uploadSessionStart(accessToken, firstChunk)

  logger.info('[DropboxService] Chunk progress', {
    chunk: 1,
    totalChunks,
    percentage: Math.round((1 / totalChunks) * 100),
  })

  // 2. Append remaining chunks (except the last one)
  let offset = CHUNK_SIZE
  let chunkNum = 2

  while (offset + CHUNK_SIZE < buffer.length) {
    const chunk = buffer.subarray(offset, offset + CHUNK_SIZE)
    await uploadSessionAppend(accessToken, sessionId, offset, chunk)

    logger.info('[DropboxService] Chunk progress', {
      chunk: chunkNum,
      totalChunks,
      percentage: Math.round((chunkNum / totalChunks) * 100),
    })

    offset += CHUNK_SIZE
    chunkNum++
  }

  // 3. Finish session with final chunk
  const finalChunk = buffer.subarray(offset)
  await uploadSessionFinish(accessToken, sessionId, offset, finalChunk, path)

  logger.info('[DropboxService] Chunked upload complete', {
    chunk: totalChunks,
    totalChunks,
    percentage: 100,
    path,
  })
}

/**
 * Start an upload session with the first chunk.
 * Returns the session ID for subsequent appends.
 */
async function uploadSessionStart(
  accessToken: string,
  chunk: Buffer,
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)
  let response: Response
  try {
    response = await fetch(
      'https://content.dropboxapi.com/2/files/upload_session/start',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ close: false }),
        },
        body: chunk,
        signal: controller.signal,
      },
    )
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Dropbox upload session start timed out after 120s')
    }
    throw error
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const errorBody = await response.text()
    handleChunkedUploadError('start', response.status, errorBody)
  }

  const data = (await response.json()) as { session_id: string }
  return data.session_id
}

/**
 * Append a chunk to an existing upload session.
 */
async function uploadSessionAppend(
  accessToken: string,
  sessionId: string,
  offset: number,
  chunk: Buffer,
): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)
  let response: Response
  try {
    response = await fetch(
      'https://content.dropboxapi.com/2/files/upload_session/append_v2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            cursor: { session_id: sessionId, offset },
            close: false,
          }),
        },
        body: chunk,
        signal: controller.signal,
      },
    )
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Dropbox upload session append timed out after 120s')
    }
    throw error
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const errorBody = await response.text()
    handleChunkedUploadError('append', response.status, errorBody)
  }
}

/**
 * Finish an upload session with the final chunk and commit the file.
 */
async function uploadSessionFinish(
  accessToken: string,
  sessionId: string,
  offset: number,
  finalChunk: Buffer,
  destinationPath: string,
): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)
  let response: Response
  try {
    response = await fetch(
      'https://content.dropboxapi.com/2/files/upload_session/finish',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            cursor: { session_id: sessionId, offset },
            commit: {
              path: destinationPath,
              mode: 'overwrite',
              autorename: false,
              mute: true,
            },
          }),
        },
        body: finalChunk,
        signal: controller.signal,
      },
    )
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Dropbox upload session finish timed out after 120s')
    }
    throw error
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const errorBody = await response.text()
    handleChunkedUploadError('finish', response.status, errorBody)
  }
}

/**
 * Handle errors from chunked upload API calls with consistent classification.
 */
function handleChunkedUploadError(
  operation: string,
  status: number,
  errorBody: string,
): never {
  logger.error(`[DropboxService] Upload session ${operation} failed`, {
    status,
    body: errorBody,
  })

  // Auth errors (400 invalid_grant, 401 unauthorized)
  if (
    (status === 400 && errorBody.includes('invalid_grant')) ||
    status === 401
  ) {
    throw new DropboxInvalidGrantError()
  }

  // Rate limiting — re-throw to trigger Cloud Task retry with backoff
  if (status === 429) {
    throw new Error(`Dropbox rate limited during upload session ${operation}`)
  }

  // Insufficient space
  if (status === 409 && errorBody.includes('insufficient_space')) {
    throw new DropboxInsufficientSpaceError()
  }

  throw new Error(
    `Dropbox upload session ${operation} failed: ${status}`,
  )
}
