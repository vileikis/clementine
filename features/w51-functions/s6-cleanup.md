### Stage 6: Production Readiness (Days 12-13)

**Goal**: Monitoring, optimization, and operational tooling.

### Deliverables

**1. Structured Logging Helper**

```tsx
// functions/src/utils/processingLogger.ts
import { logger } from "firebase-functions";

export class ProcessingLogger {
  private sessionId: string;
  private startTime: number;
  private stepTimings: Map<string, number> = new Map();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }

  logStart(config: {
    projectId: string;
    experienceType: string;
    inputCount: number;
  }) {
    logger.info("Pipeline started", {
      sessionId: this.sessionId,
      ...config,
      labels: { component: "media-processor", version: "v1" },
    });
  }

  logStepStart(step: string) {
    this.stepTimings.set(step, Date.now());
    logger.info("Step started", {
      sessionId: this.sessionId,
      step,
      labels: { component: "media-processor", step },
    });
  }

  logStepComplete(step: string, metadata?: Record<string, any>) {
    const startTime = this.stepTimings.get(step);
    const durationMs = startTime ? Date.now() - startTime : 0;

    logger.info("Step completed", {
      sessionId: this.sessionId,
      step,
      durationMs,
      ...metadata,
      labels: { component: "media-processor", step },
    });
  }

  logComplete(output: { format: string; sizeBytes: number }) {
    const totalDurationMs = Date.now() - this.startTime;

    logger.info("Pipeline completed", {
      sessionId: this.sessionId,
      totalDurationMs,
      format: output.format,
      sizeBytes: output.sizeBytes,
      labels: { component: "media-processor", status: "success" },
    });
  }

  logError(error: Error, step: string) {
    logger.error("Pipeline failed", {
      sessionId: this.sessionId,
      step,
      error: error.message,
      stack: error.stack,
      totalDurationMs: Date.now() - this.startTime,
      labels: { component: "media-processor", status: "error" },
    });
  }
}
```

**2. Gallery Query Optimization**

```tsx
// functions/src/repositories/sessionRepository.ts

// Requires composite index: projectId + outputs.completedAt
async function getProjectGallery(
  projectId: string,
  options: { limit?: number; cursor?: Date } = {}
): Promise<Session[]> {
  const { limit = 50, cursor } = options;

  let query = db
    .collection("sessions")
    .where("projectId", "==", projectId)
    .where("outputs", "!=", null)
    .orderBy("outputs.completedAt", "desc")
    .limit(limit);

  if (cursor) {
    query = query.startAfter(cursor);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Session));
}

// Event-specific gallery
async function getEventGallery(
  projectId: string,
  eventId: string,
  limit = 50
): Promise<Session[]> {
  const snapshot = await db
    .collection("sessions")
    .where("projectId", "==", projectId)
    .where("eventId", "==", eventId)
    .where("outputs", "!=", null)
    .orderBy("outputs.completedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Session));
}
```

**3. Cleanup Processing State**

```tsx
// functions/src/services/processingService.ts
async function cleanupProcessingState(sessionId: string): Promise<void> {
  await db.doc(`sessions/${sessionId}`).update({
    processing: FieldValue.delete(),
  });

  logger.info("Processing state cleaned up", { sessionId });
}

// Called in completeProcessing()
async function completeProcessing(
  sessionId: string,
  outputs: SessionOutputs
): Promise<void> {
  await db.doc(`sessions/${sessionId}`).update({
    outputs,
    processing: FieldValue.delete(), // Clean up immediately
    updatedAt: FieldValue.serverTimestamp(),
  });
}
```

**4. Admin Endpoints**

```tsx
// functions/src/functions/admin.ts
import { onRequest } from "firebase-functions/v2/https";

// Replay failed job
export const replaySession = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const { sessionId } = req.body;

    // Verify admin auth
    // ...

    const session = await getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Clear failed state
    await db.doc(`sessions/${sessionId}`).update({
      processing: FieldValue.delete(),
      outputs: FieldValue.delete(),
    });

    // Re-queue
    await queueProcessingTask(sessionId, `replay-${Date.now()}`);

    logger.info("Session replayed", { sessionId });
    res.json({ status: "queued", sessionId });
  }
);

// Get processing metrics
export const getMetrics = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const { date = "today" } = req.query;

    // Query from logs (Cloud Logging)
    // In practice, you'd use Cloud Logging API or pre-aggregated metrics

    res.json({
      date,
      note: 'Query Cloud Logging with: labels.component="media-processor"',
    });
  }
);
```

**5. Temp File Cleanup**

```tsx
// functions/src/utils/cleanup.ts
import * as fs from "fs/promises";

async function withTempDir<T>(
  sessionId: string,
  fn: (tempDir: string) => Promise<T>
): Promise<T> {
  const tempDir = `/tmp/${sessionId}`;

  try {
    await fs.mkdir(tempDir, { recursive: true });
    return await fn(tempDir);
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      logger.debug("Temp directory cleaned", { sessionId, tempDir });
    } catch (e) {
      logger.warn("Failed to clean temp directory", {
        sessionId,
        error: e.message,
      });
    }
  }
}

// Usage in pipeline
async function processMedia(sessionId: string): Promise<SessionOutputs> {
  return withTempDir(sessionId, async (tempDir) => {
    // All processing happens here
    // tempDir automatically cleaned up after
  });
}
```

**6. Firestore Indexes**

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "outputs.completedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "outputs.completedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "processing.state", "order": "ASCENDING" },
        { "fieldPath": "processing.startedAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**7. Deploy Script (Final)**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-"staging"}

echo "🚀 Deploying to: $ENVIRONMENT"

# Build shared package
echo "📦 Building shared package..."
pnpm --filter @clementine/shared build

# Build functions
echo "🔨 Building functions..."
pnpm --filter @clementine/functions build

# Deploy indexes first
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Deploy functions
echo "☁️ Deploying functions..."
firebase deploy --only functions

# Verify deployment
echo "✅ Verifying deployment..."
curl -s "https://us-central1-${GCLOUD_PROJECT}.cloudfunctions.net/helloWorld" | jq .

echo "🎉 Deployment complete!"

```

### Testing Checkpoint

- [ ] Gallery loads <500ms for 50 items
- [ ] Processing state cleaned after completion
- [ ] Temp files deleted after processing
- [ ] Admin can replay failed sessions
- [ ] Logs filterable by sessionId, step, status
- [ ] Stale sessions cleaned by scheduled function
- [ ] Deploy script works in CI/CD

---
