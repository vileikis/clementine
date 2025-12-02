# Data Model: Experience Library

**Feature**: 015-experience-library
**Date**: 2025-12-02

## Entity Overview

```
Experience (root collection)
  └── Step (subcollection)
```

---

## Experience Entity

**Collection Path**: `/experiences/{experienceId}`

### Fields

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | string | Yes | Auto-generated document ID |
| `companyId` | string | Yes | Reference to owning company |
| `name` | string | Yes | Display name (1-200 chars) |
| `description` | string \| null | No | Optional description |
| `stepsOrder` | string[] | Yes | Ordered array of step IDs |
| `status` | "active" \| "deleted" | Yes | Soft delete status |
| `deletedAt` | number \| null | No | Timestamp when soft deleted |
| `createdAt` | number | Yes | Creation timestamp (ms) |
| `updatedAt` | number | Yes | Last update timestamp (ms) |

### Future Fields (not implemented in MVP)

| Field | Type | Description |
| ----- | ---- | ----------- |
| `isPublic` | boolean | Whether experience is publicly visible |
| `previewMedia` | string | URL to preview image/video |

### TypeScript Interface

```typescript
export type ExperienceStatus = "active" | "deleted";

export interface Experience {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  stepsOrder: string[];
  status: ExperienceStatus;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Zod Schema

```typescript
import { z } from "zod";

export const experienceStatusSchema = z.enum(["active", "deleted"]);

export const experienceSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  stepsOrder: z.array(z.string()),
  status: experienceStatusSchema,
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createExperienceInputSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1).max(200).trim(),
});

export const updateExperienceInputSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type Experience = z.infer<typeof experienceSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceInputSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceInputSchema>;
```

### Validation Rules

1. `name` must be 1-200 characters, trimmed
2. `companyId` must be a valid, non-empty string
3. `stepsOrder` must contain valid step IDs (validated at runtime)
4. `status` defaults to "active" on creation
5. `deletedAt` set only when `status` changes to "deleted"

### State Transitions

```
[CREATE] → active
active → deleted (soft delete: sets deletedAt)
deleted → active (restore: clears deletedAt)
```

---

## Step Entity

**Collection Path**: `/experiences/{experienceId}/steps/{stepId}`

### Base Fields (all step types)

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | string | Yes | Auto-generated document ID |
| `experienceId` | string | Yes | Parent experience reference |
| `type` | StepType | Yes | Discriminator for step config |
| `title` | string \| null | No | Step heading text |
| `description` | string \| null | No | Step body text |
| `mediaUrl` | string \| null | No | Media asset URL |
| `mediaType` | MediaType \| null | No | Type of media asset |
| `ctaLabel` | string \| null | No | Call-to-action button text |
| `createdAt` | number | Yes | Creation timestamp (ms) |
| `updatedAt` | number | Yes | Last update timestamp (ms) |

### Step Types (discriminated union)

| Type | Config Fields | Description |
| ---- | ------------- | ----------- |
| `info` | none | Welcome/message screen |
| `short-text` | variable, placeholder, maxLength, required | Single-line text input |
| `long-text` | variable, placeholder, maxLength, required | Multi-line text input |
| `multiple-choice` | options[], allowMultiple, required, variable | Select from options |
| `yes-no` | yesLabel, noLabel, variable | Binary choice |
| `opinion-scale` | min, max, minLabel, maxLabel, variable | Numeric scale |
| `email` | variable | Email collection |
| `capture` | cameraSide, mode | Photo/video capture |
| `processing` | messages[], estimatedDuration | Loading screen |
| `reward` | shareOptions, downloadEnabled | Final result screen |
| `experience-picker` | (deprecated) | Legacy - hidden in UI |

### TypeScript Interface (base)

```typescript
export type StepType =
  | "info"
  | "short-text"
  | "long-text"
  | "multiple-choice"
  | "yes-no"
  | "opinion-scale"
  | "email"
  | "capture"
  | "processing"
  | "reward"
  | "experience-picker";

export type MediaType = "image" | "gif" | "video" | "lottie";

export interface StepBase {
  id: string;
  experienceId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  ctaLabel?: string | null;
  createdAt: number;
  updatedAt: number;
}

// Full Step type is a discriminated union of all step types
// See existing steps/types/step.types.ts for complete definition
```

### Changes from Journey-based Steps

| Field | Old | New |
| ----- | --- | --- |
| `eventId` | Required | Removed |
| `journeyId` | Required | Renamed to `experienceId` |

---

## Firestore Indexes

### Required Composite Indexes

1. **Experience list by company**
   ```
   Collection: experiences
   Fields: companyId (ASC), status (ASC), createdAt (DESC)
   ```

2. **Steps by experience**
   ```
   Collection Group: steps
   Fields: experienceId (ASC), createdAt (ASC)
   ```

---

## Relationships

```
Company (1) ──────────< Experience (many)
                              │
                              └───────< Step (many)
```

- One Company has many Experiences (via `companyId` reference)
- One Experience has many Steps (subcollection)
- Steps are ordered via `experience.stepsOrder` array (denormalized for UI)

---

## Queries

### List experiences by company

```typescript
db.collection("experiences")
  .where("companyId", "==", companyId)
  .where("status", "==", "active")
  .orderBy("createdAt", "desc")
```

### Get experience with steps

```typescript
// Experience document
db.collection("experiences").doc(experienceId)

// Steps subcollection
db.collection("experiences").doc(experienceId).collection("steps")
```

### Real-time subscription pattern

```typescript
// Experience list
onSnapshot(
  query(
    collection(db, "experiences"),
    where("companyId", "==", companyId),
    where("status", "==", "active")
  ),
  (snapshot) => { /* update state */ }
)

// Steps for experience
onSnapshot(
  collection(db, "experiences", experienceId, "steps"),
  (snapshot) => { /* update state, apply stepsOrder */ }
)
```
