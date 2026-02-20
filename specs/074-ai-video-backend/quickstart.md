# Quickstart: AI Video Backend

**Feature Branch**: `074-ai-video-backend`
**Date**: 2026-02-20

## Prerequisites

- Node.js 20+ (Firebase Functions runtime)
- pnpm 10.18.1
- Firebase CLI installed
- Access to Google Cloud project with Vertex AI API enabled
- Veo model access granted (veo-3.1-generate-001 / veo-3.1-fast-generate-001)

## Setup

```bash
# 1. Switch to feature branch
git checkout 074-ai-video-backend

# 2. Install dependencies (no new packages — @google/genai already installed)
pnpm install

# 3. Build shared package (schema changes)
pnpm --filter @clementine/shared build

# 4. Build functions
pnpm functions:build
```

## Environment

Ensure `functions/.env` has:
```
GCLOUD_PROJECT=<your-project-id>
VERTEX_AI_LOCATION=us-central1
```

**Important**: Veo requires a regional location (e.g., `us-central1`), NOT `global`.

## Key Files

### New files
- `functions/src/services/transform/outcomes/aiVideoOutcome.ts` — Video outcome executor
- `functions/src/services/transform/operations/aiGenerateVideo.ts` — Veo video generation operation

### Modified files
- `packages/shared/src/schemas/experience/outcome.schema.ts` — Schema updates (aspect ratio, duration)
- `functions/src/services/transform/engine/runOutcome.ts` — Register executor
- `functions/src/callable/startTransformPipeline.ts` — Accept `ai.video` type
- `functions/src/services/transform/operations/uploadOutput.ts` — Support video format
- `functions/src/services/transform/types.ts` — Add `reportProgress` to context
- `functions/src/tasks/transformPipelineTask.ts` — Progress callback + timeout/memory

## Testing

```bash
# Run shared package tests (schema validation)
pnpm --filter @clementine/shared test

# Build and type-check functions
pnpm functions:build
```

### Manual E2E Test

1. Deploy functions: `pnpm functions:deploy`
2. In the admin dashboard, create an experience with an `ai.video` outcome (animate task)
3. Open the guest link on a mobile device
4. Upload a photo
5. Verify: video result appears with thumbnail, progress updates shown during processing

## Architecture Overview

```
Guest uploads photo
        ↓
startTransformPipeline (callable)
  - Validates ai.video outcome type ← UPDATED
  - Creates job + queues Cloud Task
        ↓
transformPipelineTask (Cloud Task)
  - Calls runOutcome() dispatcher
        ↓
runOutcome() dispatcher
  - Routes to aiVideoOutcome ← NEW
        ↓
aiVideoOutcome executor ← NEW
  1. Download subject photo (getSourceMedia + downloadFromStorage)
  2. Generate frames if needed (aiGenerateImage — existing)
  3. Generate video (aiGenerateVideo — NEW, calls Veo API)
  4. Upload result (uploadOutput — EXTENDED)
  5. Return JobOutput
        ↓
Guest receives video result with thumbnail
```
