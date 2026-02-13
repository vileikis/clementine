/**
 * Callable Function: submitGuestEmail
 *
 * Saves a guest's email address to a session for result delivery.
 * Called from the guest loading screen email capture form.
 * If the job is already completed, queues sendSessionEmail immediately.
 *
 * See contracts/submit-guest-email.yaml (CF-001)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { submitGuestEmailPayloadSchema } from '../schemas/email.schema'
import { fetchSession, updateSessionGuestEmail } from '../repositories/session'
import { queueSendSessionEmail } from '../infra/task-queues'

export const submitGuestEmail = onCall(
  {
    region: 'europe-west1',
  },
  async (request) => {
    // Validate payload
    const parseResult = submitGuestEmailPayloadSchema.safeParse(request.data)
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid request data', {
        issues: parseResult.error.issues,
      })
    }

    const { projectId, sessionId, email } = parseResult.data

    logger.info('[SubmitGuestEmail] Processing', { projectId, sessionId })

    // Fetch session
    const session = await fetchSession(projectId, sessionId)
    if (!session) {
      throw new HttpsError('not-found', 'Session not found')
    }

    // Prevent overwrite — guestEmail should only be set once
    if (session.guestEmail !== null) {
      throw new HttpsError(
        'already-exists',
        'Email already submitted for this session',
      )
    }

    // Write guestEmail to session
    await updateSessionGuestEmail(projectId, sessionId, email)

    // If job is NOT completed or missing result media, do NOT queue email
    if (session.jobStatus !== 'completed' || !session.resultMedia) {
      return { success: true }
    }

    try {
      await queueSendSessionEmail({
        projectId,
        sessionId,
        resultMedia: {
          url: session.resultMedia.url,
          filePath: session.resultMedia.filePath!,
          displayName: session.resultMedia.displayName,
        },
      })
    } catch (error) {
      logger.warn('[SubmitGuestEmail] Failed to queue email task', {
        projectId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return { success: true }
  },
)
