# Firebase Cloud Functions

This document defines principles and patterns for Firebase Cloud Functions design, structure, and implementation.

## Core Principles

### 1. Modular API Only
- Always use Firebase Admin modular API (not global namespace)
- Ensures compatibility, smaller bundles, fewer module loading issues
- Future-proof approach recommended by Firebase

### 2. Separation of Concerns
- HTTP endpoints for external triggers
- Cloud Tasks for async processing
- Services for business logic
- Clear, maintainable structure

### 3. Type Safety
- TypeScript strict mode enabled
- Zod validation for all inputs
- Explicit error handling

## Project Structure

```
functions/
├── src/
│   ├── http/                    # HTTP endpoints (triggers)
│   │   └── processMedia.ts      # Public HTTP function
│   ├── tasks/                   # Cloud Task handlers (async)
│   │   └── processMediaJob.ts   # Long-running processing
│   ├── services/                # Business logic
│   │   ├── media-pipeline/      # Media processing service
│   │   └── ai/                  # AI transformation service
│   ├── lib/                     # Utilities & helpers
│   │   ├── firebase-admin.ts    # Admin SDK initialization
│   │   ├── session.ts           # Session helpers
│   │   ├── storage.ts           # Storage helpers
│   │   └── schemas/             # Zod validation schemas
│   └── index.ts                 # Function exports
├── scripts/                     # Tooling & seeding
└── seed-data/                   # Test data
```

### ✅ DO: Organize by Trigger Type

```
http/        → Public HTTP endpoints (external triggers)
tasks/       → Cloud Tasks (internal async processing)
firestore/   → Firestore triggers (future)
scheduled/   → Scheduled functions (future)
```

**Benefits:**
- Clear separation of concerns
- Easy to find functions by trigger type
- Scales well as functions grow

### ✅ DO: Extract Business Logic to Services

```typescript
// ❌ Bad: Logic in HTTP function
export const processMedia = onRequest(async (req, res) => {
  // 200 lines of FFmpeg processing logic...
})

// ✅ Good: Thin handler, thick service
export const processMedia = onRequest(async (req, res) => {
  const { sessionId } = req.body
  await mediaPipelineService.processSession(sessionId)
  res.json({ success: true })
})
```

## Firebase Admin SDK - Modular API

### ✅ DO: Use Modular Imports

```typescript
// ✅ Correct - Modular API
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

initializeApp()
const db = getFirestore()
const storage = getStorage()
```

**Why modular API:** Better tree-shaking, emulator reliability, avoids module loading issues (e.g., `FieldValue` undefined with global namespace).

### Centralized Initialization

```typescript
// lib/firebase-admin.ts
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Initialize once
if (getApps().length === 0) {
  initializeApp()
}

export const db = getFirestore()
export const storage = getStorage()
```

**Import everywhere:**
```typescript
import { db, storage } from '../lib/firebase-admin'
```

## Function Types & Patterns

### HTTP Functions (External Triggers)

**Use for:**
- Public API endpoints
- Webhook receivers
- External integrations

**Pattern:**
```typescript
import { onRequest } from 'firebase-functions/v2/https'

export const processMedia = onRequest(async (req, res) => {
  // 1. Validate input
  const input = processMediaSchema.parse(req.body)

  // 2. Queue async task
  await enqueueClo udTask('processMediaJob', input)

  // 3. Return immediately
  res.json({ success: true, message: 'Processing queued' })
})
```

**Best practices:**
- Return quickly (queue tasks for long operations)
- Validate all inputs with Zod
- Handle CORS if needed
- Use proper HTTP status codes

### Cloud Tasks (Async Processing)

**Use for:**
- Long-running operations
- Media processing (FFmpeg, AI)
- Operations > 60 seconds

**Pattern:**
```typescript
import { onTaskDispatched } from 'firebase-functions/v2/tasks'

export const processMediaJob = onTaskDispatched(async (req) => {
  const { sessionId } = req.data

  try {
    // Long-running operation
    await mediaPipelineService.processSession(sessionId)
  } catch (error) {
    // Update session with error
    await updateSessionStatus(sessionId, 'failed', error.message)
    throw error // Task will retry
  }
})
```

**Best practices:**
- Idempotent operations (safe to retry)
- Update status in Firestore for client feedback
- Handle failures gracefully
- Use reasonable timeouts

## Media Processing Patterns

### Direct FFmpeg Integration

**Why direct CLI:**
- `fluent-ffmpeg` is unmaintained (read-only repository)
- Works with latest FFmpeg versions
- No wrapper overhead

**Pattern:**
```typescript
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args)

    process.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg exited with code ${code}`))
    })

    process.stderr.on('data', (data) => {
      console.error('FFmpeg:', data.toString())
    })
  })
}
```

**Location:** `services/media-pipeline/ffmpeg.ts`

### Pipeline Split by Media Type

**Why separate pipelines:**
- Each format has unique requirements
- Easier to maintain and test
- Clear separation of concerns

**Structure:**
```
services/media-pipeline/
├── ffmpeg.ts           # Shared FFmpeg utilities
├── image.pipeline.ts   # Single image processing
├── gif.pipeline.ts     # Multi-frame GIF generation
└── video.pipeline.ts   # MP4 video creation
```

**Each pipeline:**
- Input: Session document + source files
- Output: Processed media in Storage + updated session
- Error handling: Update session status on failure

## Validation & Error Handling

### ✅ DO: Validate All Inputs

```typescript
import { z } from 'zod'

const processMediaSchema = z.object({
  sessionId: z.string(),
  mediaType: z.enum(['image', 'gif', 'video']),
})

export const processMedia = onRequest(async (req, res) => {
  try {
    const input = processMediaSchema.parse(req.body)
    // Process...
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', issues: error.issues })
      return
    }
    throw error
  }
})
```

### ✅ DO: Update Session Status

```typescript
try {
  await updateSession(sessionId, { status: 'processing' })
  await processMedia(sessionId)
  await updateSession(sessionId, {
    status: 'completed',
    outputUrl: downloadUrl,
  })
} catch (error) {
  await updateSession(sessionId, {
    status: 'failed',
    error: error.message,
  })
  throw error
}
```

**Benefits:**
- Client can subscribe to session changes
- Real-time progress updates
- Clear error messaging

### ✅ DO: Log Structured Errors

```typescript
import { logger } from 'firebase-functions/v2'

try {
  await processMedia(sessionId)
} catch (error) {
  logger.error('Media processing failed', {
    sessionId,
    error: error.message,
    stack: error.stack,
  })
  throw error
}
```

## Storage Patterns

### ✅ DO: Organize Files by Company/Type

```
media/
├── {companyId}/
│   ├── images/
│   │   └── {timestamp}-{filename}.jpg
│   ├── gifs/
│   │   └── {timestamp}-{filename}.gif
│   └── videos/
│       └── {timestamp}-{filename}.mp4
```

### ✅ DO: Generate Public URLs

```typescript
import { getStorage } from 'firebase-admin/storage'

const storage = getStorage()
const bucket = storage.bucket()
const file = bucket.file(filePath)

// Make file public
await file.makePublic()

// Generate public URL
const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
```

### ✅ DO: Use Temporary Files

```typescript
import tmp from 'tmp'
import fs from 'fs/promises'

const tmpFile = tmp.fileSync({ postfix: '.jpg' })
try {
  // Process file
  await runFFmpeg(['-i', input, tmpFile.name])

  // Upload to Storage
  await bucket.upload(tmpFile.name, {
    destination: outputPath,
  })
} finally {
  // Always cleanup
  tmpFile.removeCallback()
}
```

## Environment Configuration

### Development (Emulators)

```bash
pnpm functions:serve
```

**Emulator UI:** http://localhost:4000

### Environment Variables

```typescript
// No .env file needed for Firebase project
// Use Firebase config automatically:
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore() // Automatically uses project config
```

## Testing

### Local Testing with Emulators

```bash
# Terminal 1: Start emulators
pnpm functions:serve

# Terminal 2: Seed test data
pnpm functions:seed
```

### Unit Testing

See `testing/testing.md` for Vitest setup and Firebase mocking patterns.

### Manual Testing

See `/functions/MANUAL-TESTING.md` for comprehensive test cases and curl commands.

## Deployment

### Build Functions

```bash
pnpm functions:build
```

### Deploy All Functions

```bash
pnpm functions:deploy
```

### Deploy Specific Function

```bash
firebase deploy --only functions:processMedia
```

### Production Deployment

```bash
# Always build first
pnpm functions:build

# Deploy to production
firebase deploy --only functions --project production
```

## Performance Optimization

### ✅ DO: Use Memory-Appropriate Instances

```typescript
import { onRequest } from 'firebase-functions/v2/https'

export const processMedia = onRequest(
  {
    memory: '2GiB',        // FFmpeg needs memory
    timeoutSeconds: 300,   // 5 minutes for video processing
    maxInstances: 10,      // Limit concurrent processing
  },
  async (req, res) => {
    // Handler...
  }
)
```

### ✅ DO: Implement Retry Logic

```typescript
export const processMediaJob = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      maxBackoffSeconds: 60,
    },
  },
  async (req) => {
    // Handler...
  }
)
```

### ✅ DO: Clean Up Resources

```typescript
const tmpFiles: string[] = []

try {
  // Create temp files
  tmpFiles.push(tmpFile1.name, tmpFile2.name)

  // Process...
} finally {
  // Always cleanup
  await Promise.all(tmpFiles.map(f => fs.unlink(f).catch(() => {})))
}
```

## Best Practices Summary

### ✅ DO

- Use modular Firebase Admin API
- Validate all inputs with Zod
- Update Firestore for client status updates
- Extract business logic to services
- Use Cloud Tasks for long operations
- Clean up temporary files
- Log structured errors
- Test with emulators

### ❌ DON'T

- Use global `admin` namespace
- Block HTTP functions with long operations
- Skip input validation
- Leave temp files on disk
- Expose internal errors to clients
- Hardcode configuration values
- Skip error handling

## Quick Reference

| Task | Pattern |
|------|---------|
| **HTTP endpoint** | `onRequest()` from `firebase-functions/v2/https` |
| **Cloud Task** | `onTaskDispatched()` from `firebase-functions/v2/tasks` |
| **Firestore query** | `getFirestore()` from `firebase-admin/firestore` |
| **Storage upload** | `getStorage().bucket().upload()` |
| **FFmpeg command** | `spawn(ffmpegPath, args)` |
| **Temp file** | `tmp.fileSync()` + cleanup in `finally` |
| **Validation** | `schema.parse(input)` with Zod |
| **Error logging** | `logger.error()` from `firebase-functions/v2` |

## Resources

- [Cloud Functions v2 Docs](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Cloud Tasks Documentation](https://cloud.google.com/tasks/docs)
