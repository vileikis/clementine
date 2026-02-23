# Clementine Functions

Firebase Cloud Functions for Clementine - the digital AI photobooth.

## Purpose

This package contains Firebase Cloud Functions (v2) for:

- **Transform Pipeline** - AI-powered image transformation with Gemini
- **Media Processing Pipeline** - Image, GIF, and video generation from photos
- **API Endpoints** - HTTP functions for triggering pipelines
- **Task Handlers** - Async Cloud Tasks for long-running operations

## Architecture

### Transform Pipeline (Active)

The transform pipeline handles AI-powered image transformations using Google's Gemini.

**Flow:**

1. `startTransformPipelineV2` - Callable function creates a job and queues processing
2. `transformPipelineJob` - Cloud Task processes the job asynchronously
3. AI service transforms images via Gemini provider
4. Results stored in Firebase Storage, job status updated in Firestore

### Media Processing Pipeline (Legacy)

Transforms uploaded photos into final outputs (images, GIFs, or videos) using FFmpeg.

**Key Design Decisions:**

1. **Direct FFmpeg Integration**
   - Direct `child_process.spawn` calls (no `fluent-ffmpeg` wrapper)
   - Works with latest ffmpeg versions via `ffmpeg-static`
   - Location: `src/services/media-pipeline/ffmpeg.ts`

2. **Pipeline Split by Media Type**
   - `image.pipeline.ts` - Single image scaling and cropping
   - `gif.pipeline.ts` - Multi-frame GIF with palette generation

### File Structure

```
functions/
├── src/
│   ├── callable/
│   │   └── startTransformPipeline.ts  # Transform pipeline callable function
│   ├── tasks/
│   │   └── transformPipelineJob.ts    # Transform pipeline task handler
│   ├── services/
│   │   ├── ai/
│   │   │   ├── ai-transform.service.ts # AI transformation orchestration
│   │   │   ├── config.ts               # AI service configuration
│   │   │   └── providers/
│   │   │       └── gemini.provider.ts  # Google Gemini integration
│   │   └── media-pipeline/
│   │       ├── ffmpeg.ts               # FFmpeg wrapper (direct CLI)
│   │       ├── image.pipeline.ts       # Single image processing
│   │       ├── gif.pipeline.ts         # GIF processing
│   │       └── ai-transform-step.ts    # AI transform pipeline step
│   ├── repositories/
│   │   ├── job.ts                      # Job CRUD operations
│   │   ├── session.ts                  # Session data access
│   │   └── experience.ts               # Experience data access
│   ├── infra/
│   │   ├── firebase-admin.ts           # Firebase Admin SDK setup
│   │   └── storage.ts                  # Firebase Storage helpers
│   ├── schemas/
│   │   ├── transform-pipeline.schema.ts # Transform pipeline validation
│   │   └── media-pipeline.schema.ts     # Media pipeline validation
│   ├── utils/
│   │   └── temp.ts                     # Temp file utilities
│   └── index.ts                        # Function exports
├── scripts/
│   ├── migrations/                     # Database migration scripts
│   └── seed-emulators.ts               # Seed test data for local dev
└── seed-data/
    └── images/                         # Test images for seeding
```

## Exported Functions

| Function                   | Type     | Description                    |
| -------------------------- | -------- | ------------------------------ |
| `helloWorld`               | HTTP     | Health check endpoint          |
| `startTransformPipelineV2` | Callable | Triggers AI transform pipeline |
| `transformPipelineJob`     | Task     | Processes AI transform jobs    |

## Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- Firebase CLI

### Installation

```bash
# From root
pnpm install

# Build functions
pnpm functions:build
```

## Development

### Local Development with Emulators

```bash
# Terminal 1: Start emulators
pnpm functions:serve

# Terminal 2: Seed test data
pnpm functions:seed
```

**Emulator UI**: http://localhost:4000

### Testing

```bash
# Run tests
pnpm functions:test

# Watch mode
cd functions && pnpm test:watch
```

### Testing Callable Functions Locally

#### Option 1: Firebase Functions Shell with Emulators (Recommended)

The Firebase shell provides an interactive REPL for testing functions:

```bash
# Terminal 1: Start emulators
pnpm functions:serve

# Terminal 2: Start shell connected to emulators
cd functions
pnpm shell

# In the shell, call a callable function:
startTransformPipelineV2({ jobId: "test-job-123" })
```

The `pnpm shell` script automatically sets emulator environment variables and verifies connectivity.

**Testing authenticated callable functions:**

Callable functions that require authentication can be tested by passing a mock auth context as the second argument:

```javascript
// Unauthenticated call (will fail if function requires auth)
startTransformPipelineV2({ projectId: 'proj-1', sessionId: 'sess-1' })

// Authenticated call with mock user
startTransformPipelineV2(
  { projectId: 'proj-1', sessionId: 'sess-1' },
  { auth: { uid: 'test-user-123', token: { email: 'test@example.com' } } },
)
```

> **Note:** Running `firebase functions:shell` directly (without the script) connects to **production** Firebase services.

#### Option 2: Using curl

Callable functions expect a POST request with a JSON body containing a `data` field:

```bash
# First start emulators
pnpm functions:serve

# Then call the function
curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/startTransformPipelineV2 \
    -H "Content-Type: application/json" \
    -d '{ "data": { "projectId": "proj-1", "sessionId": "sess-1" } }'

curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/startTransformPipelineV2 \
    -H "Content-Type: application/json" \
    -d '{ "data": { "projectId": "817gbhF6aMc9SM6C3q1x", "sessionId": "IWSHNRioRh8vzXfhIec0" } }'

curl -X POST http://127.0.0.1:5003/clementine-7568d/europe-west1/submitGuestEmail \
    -H "Content-Type: application/json" \
    -d '{ "data": { "projectId": "817gbhF6aMc9SM6C3q1x", "sessionId": "9sraDlQsWOF99I06doF2", "email": "iggy.vileikis@gmail.com" } }'


```

**Tips:**

- Replace `<project-id>` with your Firebase project ID (check `.firebaserc`)
- The emulator URL format is: `http://127.0.0.1:5003/clementine-7568d/<region>/<function-name>`
- Check the emulator UI at http://localhost:4000 to see function logs

See `MANUAL-TESTING.md` for additional test cases.

### Key Technologies

- **Runtime**: Node.js 22, TypeScript 5
- **Functions**: Firebase Cloud Functions v2 (7.x)
- **Database**: Firebase Firestore (Admin SDK 13.x)
- **Storage**: Firebase Storage
- **AI**: Google Gemini via `@google/genai`
- **Media**: FFmpeg via `ffmpeg-static`
- **Validation**: Zod 4.x
- **Shared Types**: `@clementine/shared` workspace package

### Firebase Admin SDK - Modular API

**IMPORTANT**: Always use the **modular API** for Firebase Admin SDK.

✅ **Correct (Modular API)**:

```typescript
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

initializeApp()
const db = getFirestore()
const storage = getStorage()
```

❌ **Incorrect (Global Namespace)**:

```typescript
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()
const storage = admin.storage()
```

**Why modular API?**

- Better tree-shaking and smaller bundle sizes
- More reliable in emulator environment
- Avoids module loading issues with `FieldValue` and other exports
- Future-proof (Firebase's recommended approach)

### Database Migrations

Place Firestore data migration scripts in `scripts/migrations/`:

```bash
# Run a migration
cd functions
pnpm tsx scripts/migrations/2024-01-example.ts
```

Migrations have access to Firebase Admin SDK and shared utilities from this workspace.

### FFmpeg Operations

- **Image scaling/cropping**: Lanczos filter with center-crop
- **GIF creation**: Palette-based with dithering
