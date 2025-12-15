# Original PLan

- see ./plan.md

### Stage 2: Deduplication & Error Handling (Days 4-5)

**Goal**: Prevent duplicate processing and handle failures gracefully with Cloud Tasks.

### Deliverables

**1. Cloud Tasks Deduplication**

```tsx
// functions/src/services/taskService.ts
import { CloudTasksClient } from "@google-cloud/tasks";

const tasksClient = new CloudTasksClient();
const PROJECT = process.env.GCLOUD_PROJECT;
const LOCATION = "us-central1";
const QUEUE = "media-processing";

async function queueProcessingTask(
  sessionId: string,
  idempotencyKey?: string
): Promise<{ status: "queued" | "already_queued" }> {
  const key = idempotencyKey || `${sessionId}-${Date.now()}`;
  const taskName = `projects/${PROJECT}/locations/${LOCATION}/queues/${QUEUE}/tasks/session-${key}`;

  const queuePath = tasksClient.queuePath(PROJECT, LOCATION, QUEUE);

  try {
    await tasksClient.createTask({
      parent: queuePath,
      task: {
        name: taskName, // Deduplication key
        httpRequest: {
          httpMethod: "POST",
          url: `${FUNCTION_URL}/processMediaJob`,
          body: Buffer.from(JSON.stringify({ sessionId })).toString("base64"),
          headers: { "Content-Type": "application/json" },
        },
      },
    });

    logger.info("Task queued", { sessionId, taskName });
    return { status: "queued" };
  } catch (error: any) {
    if (error.code === 6) {
      // ALREADY_EXISTS
      logger.info("Task already queued (deduped)", { sessionId, taskName });
      return { status: "already_queued" };
    }
    throw error;
  }
}
```

**2. Processing Lock with Transaction**

```tsx
// functions/src/services/processingService.ts
const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function acquireProcessingLock(sessionId: string): Promise<boolean> {
  return await db.runTransaction(async (transaction) => {
    const sessionRef = db.doc(`sessions/${sessionId}`);
    const session = await transaction.get(sessionRef);

    if (!session.exists) {
      throw new Error("Session not found");
    }

    const processing = session.data()?.processing;

    // Check if already processing
    if (processing?.state === "running") {
      const ageMs = Date.now() - processing.startedAt.toMillis();

      if (ageMs < LOCK_TIMEOUT_MS) {
        logger.warn("Session already processing", {
          sessionId,
          ageMs,
          taskId: processing.taskId,
        });
        return false; // Another task is handling this
      }

      // Stale lock - log and proceed
      logger.warn("Clearing stale processing lock", {
        sessionId,
        ageMs,
        staleTaskId: processing.taskId,
      });
    }

    // Acquire lock
    transaction.update(sessionRef, {
      processing: {
        state: "running",
        currentStep: "initializing",
        startedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        attemptNumber: (processing?.attemptNumber || 0) + 1,
        taskId: `task-${sessionId}-${Date.now()}`,
      },
    });

    return true;
  });
}
```

**3. Error Classification & Handling**

```tsx
// functions/src/utils/errors.ts
const RETRYABLE_ERRORS = [
  "RATE_LIMIT",
  "TIMEOUT",
  "UNAVAILABLE",
  "RESOURCE_EXHAUSTED",
  "DEADLINE_EXCEEDED",
];

interface ClassifiedError {
  code: string;
  message: string;
  retryable: boolean;
  step: string;
}

function classifyError(error: any, step: string): ClassifiedError {
  const code = error.code || error.name || "UNKNOWN";

  return {
    code,
    message: error.message || "Unknown error",
    retryable: RETRYABLE_ERRORS.includes(code),
    step,
  };
}

async function handleProcessingError(
  sessionId: string,
  error: any,
  step: string
): Promise<void> {
  const classified = classifyError(error, step);

  await db.doc(`sessions/${sessionId}`).update({
    "processing.state": "failed",
    "processing.updatedAt": FieldValue.serverTimestamp(),
    "processing.error": {
      message: classified.message,
      code: classified.code,
      step: classified.step,
      retryable: classified.retryable,
      timestamp: FieldValue.serverTimestamp(),
    },
  });

  logger.error("Processing failed", {
    sessionId,
    error: classified.message,
    code: classified.code,
    step: classified.step,
    retryable: classified.retryable,
    labels: { component: "media-processor", status: "error" },
  });

  if (classified.retryable) {
    throw error; // Re-throw for Cloud Tasks retry
  }
  // Non-retryable: don't throw, let task complete
}
```

**4. Updated Task Processor with Dedup**

```tsx
// functions/src/functions/processMediaJob.ts
export const processMediaJob = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 30,
      maxBackoffSeconds: 600,
      maxDoublings: 3,
    },
    timeoutSeconds: 1800,
  },
  async (req) => {
    const { sessionId } = req.data;

    // Try to acquire lock
    const acquired = await acquireProcessingLock(sessionId);

    if (!acquired) {
      logger.info("Lock not acquired, skipping", { sessionId });
      return; // Another instance is handling this
    }

    try {
      const session = await getSession(sessionId);

      // Check if already completed (idempotency)
      if (session.outputs) {
        logger.info("Already completed, skipping", { sessionId });
        return;
      }

      // ... rest of processing logic
    } catch (error) {
      await handleProcessingError(sessionId, error, "unknown");
      throw error;
    }
  }
);
```

**5. Stale Lock Cleanup (Scheduled)**

```tsx
// functions/src/functions/cleanupStaleLocks.ts
import { onSchedule } from "firebase-functions/v2/scheduler";

export const cleanupStaleLocks = onSchedule(
  {
    schedule: "every 15 minutes",
    timeoutSeconds: 60,
  },
  async () => {
    const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS);

    const staleSessions = await db
      .collection("sessions")
      .where("processing.state", "==", "running")
      .where("processing.startedAt", "<", staleThreshold)
      .limit(100)
      .get();

    for (const doc of staleSessions.docs) {
      logger.warn("Cleaning up stale session", { sessionId: doc.id });

      await doc.ref.update({
        "processing.state": "failed",
        "processing.error": {
          message: "Processing timed out",
          code: "TIMEOUT",
          step: doc.data().processing.currentStep,
          retryable: true,
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    }

    logger.info("Stale lock cleanup completed", {
      cleaned: staleSessions.size,
    });
  }
);
```

### Testing Checkpoint

- [ ] Rapid duplicate submissions create only one task
- [ ] Failed task retries up to 3 times
- [ ] After 3 failures, marked as non-retryable
- [ ] Stale locks (>30min) get cleaned up
- [ ] Already-completed sessions skip reprocessing
- [ ] Client shows error state with retry option

---
