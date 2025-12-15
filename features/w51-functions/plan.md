# Media Processing Pipeline PRD

## Overview

A Firebase Functions + Cloud Tasks based media processing pipeline for transforming user-captured images into GIFs, videos, or processed images with optional AI transformations, background removal, and overlay compositing.

---

## Goals

### Primary Goals

1. **Reliable Processing**: Deliver processed media with zero data loss via Cloud Tasks deduplication and retry mechanisms
2. **Real-time Feedback**: Users see processing status updates via Firestore real-time subscriptions
3. **Flexible Pipeline**: Support conditional processing steps (AI transform, background removal, overlays) based on Experience/Event configuration
4. **Simple Architecture**: Single source of truth in `sessions` collection—no separate jobs collection

### Technical Goals

1. **Type Safety**: Shared types between web and functions via monorepo packages
2. **Deployability**: Simple deploy script that works locally and in CI/CD
3. **Observability**: Structured logging for debugging and monitoring
4. **Cost Efficiency**: Warm only user-facing endpoints; background tasks can cold start

---

## High-Level Stages Plan

| Stage | Focus                            | Days | Key Deliverables                                            |
| ----- | -------------------------------- | ---- | ----------------------------------------------------------- |
| **0** | Monorepo Foundation              | 1    | Shared types package, deploy script, hello-world function   |
| **1** | Basic Pipeline (No Manipulation) | 2    | Single image passthrough, GIF/video composition from bursts |
| **2** | Deduplication & Error Handling   | 2    | Cloud Tasks dedup, retry logic, stale lock cleanup          |
| **3** | Overlay Compositing              | 2    | Apply overlay assets from Event config                      |
| **4** | Background Removal               | 2    | Remove/replace backgrounds via external API                 |
| **5** | AI Transformation                | 2    | Gemini integration, provider abstraction                    |
| **6** | Production Readiness             | 2    | Monitoring, cleanup, gallery optimization                   |

**Total: ~13 days**

---

## Core Data Model

```tsx
// sessions/{sessionId} - Single source of truth
interface Session {
  // Configuration
  projectId: string;
  eventId: string;
  experienceId: string;
  inputAssets: InputAsset[];

  // Processing state (temporary, cleared after completion)
  processing?: {
    state: "pending" | "running" | "completed" | "failed";
    currentStep: string;
    startedAt: Timestamp;
    updatedAt: Timestamp;
    attemptNumber: number;
    taskId: string;
    error?: ProcessingError;
  };

  // Results (permanent)
  outputs?: {
    primaryUrl: string;
    thumbnailUrl: string;
    format: "gif" | "mp4" | "webm" | "image";
    dimensions: { width: number; height: number };
    sizeBytes: number;
    completedAt: Timestamp;
    processingTimeMs: number;
  };
}
```

---

## QA Test Plan

### Stage 0: Monorepo Foundation

- [ ] `pnpm install` succeeds from root
- [ ] Shared types importable in both `web` and `functions`
- [ ] `./scripts/deploy.sh` deploys hello-world function
- [ ] Function responds correctly when invoked

### Stage 1: Basic Pipeline

- [ ] Single image → returns original image URL
- [ ] 4 images (burst) → returns composed GIF
- [ ] Burst → returns composed MP4 when configured
- [ ] Real-time status updates appear in client
- [ ] Logs searchable by `sessionId`

### Stage 2: Deduplication & Error Handling

- [ ] Duplicate submit requests don't create duplicate tasks
- [ ] Failed task retries automatically (up to 3x)
- [ ] Stale locks (>30min) get cleared and reprocessed
- [ ] Non-retryable errors marked as final failure
- [ ] Client shows appropriate error state

### Stage 3: Overlay Compositing

- [ ] Overlay applied when `event.overlayAsset` is set
- [ ] No overlay when `event.overlayAsset` is null
- [ ] Overlay positioning respects config (gravity, offset)
- [ ] Works with single image AND multi-frame outputs

### Stage 4: Background Removal

- [ ] Background removed when `experience.backgroundRemoval` enabled
- [ ] Background replaced with solid color when configured
- [ ] Background replaced with image when configured
- [ ] Graceful fallback to original if API fails (when configured)

### Stage 5: AI Transformation

- [ ] AI transform applied when `experience.aiImageTransform` configured
- [ ] Prompt correctly passed to provider
- [ ] Fallback to original works when AI fails
- [ ] Multiple providers can be swapped via config

### Stage 6: Production Readiness

- [ ] Gallery query returns completed sessions ordered by date
- [ ] Processing state cleaned up after completion
- [ ] Temp files deleted after processing
- [ ] Admin can replay failed jobs
- [ ] Metrics visible in Cloud Logging

---
