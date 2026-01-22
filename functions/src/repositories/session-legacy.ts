import { db, FieldValue } from '../infra/firebase-admin'
import type {
  SessionWithProcessing,
  ProcessingState,
  SessionOutputs,
} from '@clementine/shared';

/**
 * Fetch session document from Firestore
 *
 * @param sessionId - Session document ID
 * @returns Session document or null if not found
 */
export async function fetchSession(
  sessionId: string
): Promise<SessionWithProcessing | null> {
  const doc = await db.collection('sessions').doc(sessionId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) {
    return null;
  }

  return {
    id: doc.id,
    ...data,
  } as SessionWithProcessing;
}

/**
 * Mark session as pending processing
 *
 * @param sessionId - Session document ID
 * @param attemptNumber - Current attempt number (1-3)
 * @param taskId - Cloud Task ID for tracking
 */
export async function markSessionPending(
  sessionId: string,
  attemptNumber: number,
  taskId?: string
): Promise<void> {
  const processingState: Partial<ProcessingState> = {
    state: 'pending',
    currentStep: 'pending',
    startedAt: Date.now(),
    updatedAt: Date.now(),
    attemptNumber,
  };

  if (taskId) {
    processingState.taskId = taskId;
  }

  await db.collection('sessions').doc(sessionId).update({
    processing: processingState,
  });
}

/**
 * Mark session as currently running
 *
 * @param sessionId - Session document ID
 * @param currentStep - Current processing step
 */
export async function markSessionRunning(
  sessionId: string,
  currentStep?: string
): Promise<void> {
  await db
    .collection('sessions')
    .doc(sessionId)
    .update({
      'processing.state': 'running',
      'processing.currentStep': currentStep || 'processing',
      'processing.updatedAt': FieldValue.serverTimestamp(),
    });
}

/**
 * Mark session as failed
 *
 * @param sessionId - Session document ID
 * @param errorCode - Error code
 * @param errorMessage - Error message
 */
export async function markSessionFailed(
  sessionId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  await db
    .collection('sessions')
    .doc(sessionId)
    .update({
      'processing.state': 'failed',
      'processing.error': {
        code: errorCode,
        message: errorMessage,
        timestamp: FieldValue.serverTimestamp(),
      },
      'processing.updatedAt': FieldValue.serverTimestamp(),
    });
}

/**
 * Update session with outputs and cleanup processing state
 *
 * @param sessionId - Session document ID
 * @param outputs - Final processing outputs
 */
export async function updateSessionOutputs(
  sessionId: string,
  outputs: SessionOutputs
): Promise<void> {
  await db
    .collection('sessions')
    .doc(sessionId)
    .update({
      outputs,
      processing: FieldValue.delete(), // Clean up temporary processing field
    });
}

/**
 * Update processing step (for progress tracking)
 *
 * @param sessionId - Session document ID
 * @param step - Current step name
 */
export async function updateProcessingStep(
  sessionId: string,
  step: string
): Promise<void> {
  await db
    .collection('sessions')
    .doc(sessionId)
    .update({
      'processing.currentStep': step,
      'processing.updatedAt': FieldValue.serverTimestamp(),
    });
}

/**
 * Check if session is currently being processed
 *
 * @param session - Session document
 * @returns True if session is being processed
 */
export function isSessionProcessing(session: SessionWithProcessing): boolean {
  return session.processing?.state === 'running';
}
