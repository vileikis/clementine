# Feature Spec: Functions Hardening — Pilot Prep

**Branch**: `088-functions-hardening` | **Date**: 2026-03-05
**Input**: `requirements/w10-pilots-prep/functions-hardening.md`

## Overview

Pre-pilot hardening of Firebase Cloud Functions: remove test endpoints, increase memory, relax safety filters, prevent OOM restart loops, and add retry logic for Vertex AI 429 errors.

## Requirements

### R-001: Remove Test HTTP Functions

Delete three test HTTP endpoints and their source files:
- `testVertexAI`
- `testImageGeneration`
- `testImageGenerationWithReference`

Remove exports from `src/index.ts`. No other code references these.

### R-002: Double Memory for transformPipelineTask

Increase memory from 1 GiB → 2 GiB on `transformPipelineTask`. The callable `startTransformPipelineV2` remains at defaults.

### R-003: Remove Safety Filters (personGeneration)

Set `personGeneration` to allow all content for both AI operations:

- **AI Image** (`aiGenerateImage.ts`): Add `personGeneration: 'ALLOW_ALL'` inside `imageConfig`
- **AI Video** (`aiGenerateVideo.ts`): Change `personGeneration` from `'allow_adult'` to `'allow_all'` in base config

### R-004: OOM Restart Loop Prevention

Prevent infinite restart loops when `transformPipelineTask` OOMs:
- Allow 1 retry (transient OOM may succeed on fresh instance)
- Detect retry via job status (`running` = crashed on previous attempt)
- Track `attemptCount` on the job document
- Fail immediately if `attemptCount >= 2`
- Log `process.memoryUsage()` at key execution points

### R-005: Vertex AI 429 Retry with Exponential Backoff

Retry Vertex AI API calls that fail with 429 (RESOURCE_EXHAUSTED) or 503:
- Max 3 retries, 2s initial delay, 2x backoff, ±25% jitter
- Applies to `generateContent` (image) and `generateVideos` (video)
- Non-retryable errors propagate immediately
- Log each retry attempt

## Non-Goals

- Provisioned Throughput configuration (separate investigation)
- Changes to the frontend
- Changes to export or email task functions
