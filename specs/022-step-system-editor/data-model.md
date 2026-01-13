# Data Model: Step System & Experience Editor

**Feature**: 022-step-system-editor
**Date**: 2026-01-13

## Entity Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Experience                            │
│  (Firestore: /workspaces/{wid}/experiences/{eid})           │
├─────────────────────────────────────────────────────────────┤
│  id: string                                                  │
│  name: string                                                │
│  profile: 'freeform' | 'survey' | 'story'                   │
│  status: 'active' | 'deleted'                               │
│  draft: ExperienceConfig ─────────────┐                     │
│  published: ExperienceConfig | null    │                     │
│  publishedAt: Timestamp | null         │                     │
│  publishedBy: string | null            │                     │
│  createdAt: Timestamp                  │                     │
│  updatedAt: Timestamp                  │                     │
└────────────────────────────────────────│─────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ExperienceConfig                          │
├─────────────────────────────────────────────────────────────┤
│  steps: Step[]                                               │
│  settings: ExperienceSettings (future)                       │
└──────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                          Step                                │
├─────────────────────────────────────────────────────────────┤
│  id: string (UUID)                                          │
│  type: StepType                                             │
│  config: StepConfig (type-specific)                         │
└──────────────────────────────────────────────────────────────┘
```

## Core Entities

### Step

Represents a single unit in an experience flow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier within experience (UUID v4) |
| type | StepType | Yes | Step type from registry (e.g., 'info', 'input.scale') |
| config | StepConfig | Yes | Type-specific configuration object |

**Validation Rules**:
- `id` must be unique within the experience's step list
- `type` must exist in step registry
- `config` must validate against the schema for the specified `type`

### StepType (Enumeration)

```typescript
type StepType =
  | 'info'
  | 'input.scale'
  | 'input.yesNo'
  | 'input.multiSelect'
  | 'input.shortText'
  | 'input.longText'
  | 'capture.photo'
  | 'transform.pipeline'
```

### StepCategory (Enumeration)

```typescript
type StepCategory = 'info' | 'input' | 'capture' | 'transform'
```

**Category Mapping**:
| Category | Step Types |
|----------|------------|
| info | info |
| input | input.scale, input.yesNo, input.multiSelect, input.shortText, input.longText |
| capture | capture.photo |
| transform | transform.pipeline |

---

## Step Configuration Schemas

### InfoStepConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| title | string | No | '' | Max 200 chars |
| description | string | No | '' | Max 1000 chars |
| media | MediaAsset | No | null | Image/video reference |

### InputScaleConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| question | string | Yes | - | 1-200 chars |
| min | number | No | 1 | Integer 0-10 |
| max | number | No | 5 | Integer 1-10, must be > min |
| minLabel | string | No | undefined | Max 50 chars |
| maxLabel | string | No | undefined | Max 50 chars |

### InputYesNoConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| question | string | Yes | - | 1-200 chars |

### InputMultiSelectConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| question | string | Yes | - | 1-200 chars |
| options | string[] | Yes | - | 2-10 items, each 1-100 chars |
| minSelect | number | No | 0 | Integer >= 0 |
| maxSelect | number | No | options.length | Integer >= minSelect |

### InputShortTextConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| question | string | Yes | - | 1-200 chars |
| placeholder | string | No | '' | Max 100 chars |
| maxLength | number | No | 100 | Integer 1-200 |

### InputLongTextConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| question | string | Yes | - | 1-200 chars |
| placeholder | string | No | '' | Max 200 chars |
| maxLength | number | No | 500 | Integer 1-2000 |

### CapturePhotoConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| instructions | string | No | '' | Max 200 chars |
| countdown | number | No | 0 | Integer 0-10 (0 = disabled) |
| overlay | MediaAsset | No | null | Future feature |

### TransformPipelineConfig

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| (empty) | - | - | - | No configuration in MVP |

---

## Supporting Types

### MediaAsset

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mediaAssetId | string | Yes | Reference to media library asset |
| url | string | Yes | Public URL for immediate rendering |

### ExperienceConfig

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| steps | Step[] | Yes | [] | Ordered list of steps |

### ExperienceProfile

| Value | Allowed Step Categories |
|-------|------------------------|
| freeform | info, input, capture, transform |
| survey | info, input, capture |
| story | info |

---

## State Transitions

### Experience Publish Flow

```
┌─────────────┐     validate()      ┌─────────────┐     copy draft      ┌─────────────┐
│   Draft     │ ──────────────────▶ │  Validated  │ ──────────────────▶ │  Published  │
│  (editing)  │                     │  (ready)    │    to published     │   (live)    │
└─────────────┘                     └─────────────┘                     └─────────────┘
       │                                   │
       │ modify steps                      │ validation fails
       ▼                                   ▼
┌─────────────┐                     ┌─────────────┐
│   Draft     │                     │   Draft     │
│ (auto-save) │                     │  (errors)   │
└─────────────┘                     └─────────────┘
```

### Step Lifecycle

```
┌─────────────┐     configure()     ┌─────────────┐     reorder()      ┌─────────────┐
│   Created   │ ──────────────────▶ │ Configured  │ ──────────────────▶ │  Ordered    │
│  (default)  │                     │  (valid)    │                     │  (final)    │
└─────────────┘                     └─────────────┘                     └─────────────┘
       │                                   │
       │                                   │ delete()
       ▼                                   ▼
┌─────────────┐                     ┌─────────────┐
│   Deleted   │ ◀────────────────── │   Deleted   │
│  (removed)  │                     │  (removed)  │
└─────────────┘                     └─────────────┘
```

---

## Firestore Document Structure

```typescript
// /workspaces/{workspaceId}/experiences/{experienceId}
{
  id: "exp_abc123",
  name: "Summer Event Survey",
  profile: "survey",
  status: "active",

  draft: {
    steps: [
      {
        id: "step_001",
        type: "info",
        config: {
          title: "Welcome!",
          description: "Thanks for joining us.",
          media: null
        }
      },
      {
        id: "step_002",
        type: "input.scale",
        config: {
          question: "How would you rate this event?",
          min: 1,
          max: 5,
          minLabel: "Poor",
          maxLabel: "Excellent"
        }
      },
      {
        id: "step_003",
        type: "capture.photo",
        config: {
          instructions: "Take a selfie!",
          countdown: 3,
          overlay: null
        }
      }
    ]
  },

  published: null,  // or copy of draft when published
  publishedAt: null,
  publishedBy: null,

  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: null
}
```

---

## Indexes

No additional Firestore indexes required for E2. Step data is embedded within experience documents and filtered client-side.

---

## Validation Summary

| Entity | Validation Point | Method |
|--------|-----------------|--------|
| Step.config | On config change | Zod schema parse |
| Step.type | On step creation | Registry lookup |
| Experience.draft | On publish | Full validation suite |
| Profile constraints | On publish | getStepTypesForProfile() |
