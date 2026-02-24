# Data Model: Create Tab Aspect Ratio Clarity

**Feature**: `082-create-tab-ar-clarity`
**Date**: 2026-02-24

## Overview

This is a **UI-only change** — no data model modifications. All existing schemas, Firestore documents, and backend operations remain unchanged.

## Existing Entities (Unchanged)

### Outcome Configs

Each outcome config owns an `aspectRatio` field at the outcome level:

| Config | AR Field | Type | Default | Notes |
|--------|----------|------|---------|-------|
| `photoConfigSchema` | `aspectRatio` | `imageAspectRatioSchema` | `'1:1'` | Required |
| `aiImageConfigSchema` | `aspectRatio` | `imageAspectRatioSchema` | `'1:1'` | Required |
| `aiVideoConfigSchema` | `aspectRatio` | `videoAspectRatioSchema` | `'9:16'` | Required |

### Generation Configs (Retained, Not Exposed in UI)

Each generation config has a **nullable** `aspectRatio` override:

| Config | AR Field | Type | Default | Notes |
|--------|----------|------|---------|-------|
| `imageGenerationConfigSchema` | `aspectRatio` | `imageAspectRatioSchema.nullable()` | `null` | Retained for future use |
| `videoGenerationConfigSchema` | `aspectRatio` | `videoAspectRatioSchema.nullable()` | `null` | Retained for future use |

### Capture Step Config

| Config | AR Field | Type | Default |
|--------|----------|------|---------|
| `experienceCapturePhotoStepConfigSchema` | `aspectRatio` | `aspectRatioSchema` | `'1:1'` |

### Aspect Ratio Values

| Schema | Values |
|--------|--------|
| `aspectRatioSchema` (canonical) | `'1:1'`, `'3:2'`, `'2:3'`, `'9:16'` |
| `imageAspectRatioSchema` | `'1:1'`, `'3:2'`, `'2:3'`, `'9:16'` |
| `videoAspectRatioSchema` | `'16:9'`, `'9:16'` |

### Backend Fallback Chain (Unchanged)

```
AI Image: imageGeneration.aspectRatio ?? config.aiImage.aspectRatio
AI Video: videoGeneration.aspectRatio ?? config.aiVideo.aspectRatio
Photo:    config.photo.aspectRatio (no fallback)
```

## Data Access Patterns (UI)

### Reading Capture Step AR

```typescript
// From steps array + captureStepId in outcome config
const captureStep = steps.find(s => s.id === config.captureStepId)
if (captureStep?.type === 'capture.photo') {
  captureStep.config.aspectRatio // '1:1' | '3:2' | '2:3' | '9:16'
}
```

### Reading/Writing Output AR

```typescript
// Read from outcome config
config.aspectRatio // outcome-level AR (always populated)

// Write via existing onConfigChange pattern
onConfigChange({ aspectRatio: newValue })
```
