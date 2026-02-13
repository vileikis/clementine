/**
 * Cloud Task Handler: sendSessionEmail
 *
 * Fetches a session and sends the result email if all conditions are met:
 * 1. guestEmail !== null
 * 2. jobStatus === 'completed'
 * 3. resultMedia !== null
 * 4. emailSentAt === null
 *
 * Queued from two entry points:
 *   - transformPipelineJob.finalizeJobSuccess() — job just completed
 *   - submitGuestEmail callable — guest just submitted email, job already done
 *
 * See contracts/send-session-email.yaml (CT-002)
 */
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { logger } from 'firebase-functions/v2'
import { sendSessionEmailPayloadSchema } from '../schemas/email.schema'
import { fetchSession, updateSessionEmailSentAt } from '../repositories/session'
import { sendResultEmail } from '../services/email/email.service'
import { SMTP_APP_PASSWORD } from '../infra/params'

export const sendSessionEmail = onTaskDispatched(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [SMTP_APP_PASSWORD],
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 10,
      maxBackoffSeconds: 60,
    },
  },
  async (req) => {
    // Validate payload
    const parseResult = sendSessionEmailPayloadSchema.safeParse(req.data)
    if (!parseResult.success) {
      logger.error('[SendSessionEmail] Invalid payload', {
        issues: parseResult.error.issues,
      })
      return
    }

    const { projectId, sessionId, resultMedia } = parseResult.data

    logger.info('[SendSessionEmail] Processing', { projectId, sessionId })

    // Fetch session
    const session = await fetchSession(projectId, sessionId)
    if (!session) {
      logger.warn('[SendSessionEmail] Session not found', { projectId, sessionId })
      return
    }

    // Check all four conditions
    if (!session.guestEmail) {
      logger.info('[SendSessionEmail] No guest email, skipping', { sessionId })
      return
    }
    if (session.jobStatus !== 'completed') {
      logger.info('[SendSessionEmail] Job not completed, skipping', {
        sessionId,
        jobStatus: session.jobStatus,
      })
      return
    }
    if (!session.resultMedia) {
      logger.info('[SendSessionEmail] No result media, skipping', { sessionId })
      return
    }
    if (session.emailSentAt !== null) {
      logger.info('[SendSessionEmail] Email already sent, skipping', { sessionId })
      return
    }

    // Send email
    try {
      await sendResultEmail({
        guestEmail: session.guestEmail,
        resultMediaUrl: resultMedia.url,
      })

      // Update emailSentAt on success
      await updateSessionEmailSentAt(projectId, sessionId)

      logger.info('[SendSessionEmail] Email sent successfully', {
        projectId,
        sessionId,
      })
    } catch (error) {
      logger.error('[SendSessionEmail] Failed to send email', {
        projectId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)
