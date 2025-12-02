# Data Model: Projects

**Date**: 2025-12-02
**Feature**: [spec.md](spec.md)

## Overview

This document defines the data model for the Projects feature, which is a rename/refactor of the existing Events feature module. The data model preserves all existing Event fields while renaming them to Project semantics.

## Entity Definitions

### Project

**Description**: A long-running container (campaign, tour, initiative) that organizes events. In Phase 4, Projects temporarily hold theme and scheduling fields that will move to nested Events in Phase 5.

**Firestore Path**: `/projects/{projectId}`

**Schema**:

```typescript
interface Project {
  // Identity
  id: string;                     // Firestore document ID
  name: string;                   // Human-readable name (min 1, max 100 chars)

  // Status
  status: ProjectStatus;          // "draft" | "live" | "archived" | "deleted"

  // Company Association
  companyId: string | null;       // FK to /companies/{companyId} (null for legacy data)

  // Guest Access
  sharePath: string;              // Unique path for guest access (e.g., "/p/abc123")
  qrPngPath: string;              // Firebase Storage path to QR code image (full public URL)

  // Scheduling (TEMPORARY - will move to Event in Phase 5)
  publishStartAt?: number | null; // Unix timestamp ms - when project becomes accessible
  publishEndAt?: number | null;   // Unix timestamp ms - when project becomes inaccessible

  // Active Experience/Event (TEMPORARY SEMANTICS - see note below)
  activeEventId?: string | null;  // FK to active Experience (will point to nested Event in Phase 5)

  // Theme (TEMPORARY - will move to Event in Phase 5)
  theme: ProjectTheme;            // Visual customization settings

  // Audit
  deletedAt?: number | null;      // Soft delete timestamp (Unix ms)
  createdAt: number;              // Creation timestamp (Unix ms)
  updatedAt: number;              // Last update timestamp (Unix ms)
}

type ProjectStatus = "draft" | "live" | "archived" | "deleted";
```

**Field Notes**:

- **activeEventId**: Named for Phase 5 compatibility but points to Experience IDs during Phase 4. This temporary semantic mismatch is intentional to avoid a second rename in Phase 5.
- **Temporary fields**: `theme`, `publishStartAt`, `publishEndAt` will move to nested Event entity in Phase 5. Kept at Project level in Phase 4 to preserve existing functionality.
- **sharePath**: Preserved from old `joinPath` - maintains guest access continuity during migration.
- **qrPngPath**: Stores full public URL (not relative path) for instant rendering per Constitution Principle VI.

**Validation Rules** (Zod):
```typescript
const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(NAME_LENGTH.MIN).max(NAME_LENGTH.MAX),
  status: z.enum(["draft", "live", "archived", "deleted"]),
  companyId: z.string().nullable().default(null),
  sharePath: z.string(),
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),
  activeEventId: z.string().nullable().optional().default(null),
  theme: projectThemeSchema,
  deletedAt: z.number().nullable().optional().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

**Indexes** (Firestore):
```
- companyId (ascending) - for listing projects by company
- sharePath (ascending) - for guest access lookup
- status (ascending), updatedAt (descending) - for filtered/sorted lists
```

### ProjectTheme

**Description**: Visual customization settings for a project including logos, colors, fonts, and background styling. Temporarily stored at Project level; will move to nested Event in Phase 5.

**Schema**:

```typescript
interface ProjectTheme {
  // Branding
  logoUrl?: string | null;        // Full public URL to logo image
  fontFamily?: string | null;     // Web-safe font name or Google Fonts import

  // Colors
  primaryColor: string;           // Hex color (e.g., "#3B82F6") - anchor color for the project

  // Text Styling
  text: ProjectThemeText;

  // Button Styling
  button: ProjectThemeButton;

  // Background Styling
  background: ProjectThemeBackground;
}

interface ProjectThemeText {
  color: string;                  // Hex color (e.g., "#000000")
  alignment: "left" | "center" | "right";
}

interface ProjectThemeButton {
  backgroundColor?: string | null; // Hex color (inherits primaryColor if null/undefined)
  textColor: string;              // Hex color (e.g., "#FFFFFF")
  radius: "none" | "sm" | "md" | "full"; // Border radius preset
}

interface ProjectThemeBackground {
  color: string;                  // Hex color (e.g., "#F9FAFB")
  image?: string | null;          // Full public URL to background image
  overlayOpacity: number;         // 0-1 (opacity of color overlay on background image)
}
```

**Validation Rules** (Zod):
```typescript
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const projectThemeTextSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  alignment: z.enum(["left", "center", "right"]),
});

const projectThemeButtonSchema = z.object({
  backgroundColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  textColor: z.string().regex(COLOR_REGEX),
  radius: z.enum(["none", "sm", "md", "full"]),
});

const projectThemeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  image: z.string().url().nullable().optional().default(null),
  overlayOpacity: z.number().min(0).max(1),
});

const projectThemeSchema = z.object({
  logoUrl: z.string().url().nullable().optional().default(null),
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX),
  text: projectThemeTextSchema,
  button: projectThemeButtonSchema,
  background: projectThemeBackgroundSchema,
});
```

**Default Theme** (for new projects):
```typescript
const defaultProjectTheme: ProjectTheme = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#3B82F6", // Tailwind blue-500
  text: {
    color: "#111827", // Tailwind gray-900
    alignment: "center",
  },
  button: {
    backgroundColor: null, // Inherits primaryColor
    textColor: "#FFFFFF",
    radius: "md",
  },
  background: {
    color: "#F9FAFB", // Tailwind gray-50
    image: null,
    overlayOpacity: 0.7,
  },
};
```

## Relationships

```
Company (1) ──< (many) Project
  └─ Project.companyId → Company.id

Project (1) ──< (1) Experience [TEMPORARY - Phase 4 only]
  └─ Project.activeEventId → Experience.id
     (In Phase 5, will point to nested Event → Event.experiences[])

Project (1) ── (1) QR Code (Firebase Storage)
  └─ Project.qrPngPath → Firebase Storage path
```

**Note on Relationships**:
- In Phase 4, `activeEventId` points directly to an Experience (1:1 relationship)
- In Phase 5, Projects will have nested Events, and `activeEventId` will point to an Event (1:1), which links to multiple Experiences (1:many)

## State Transitions

### Project Status

```
[Creation]
    ↓
  draft ──────────────┐
    ↓                 │
  live ───────────────┤
    ↓                 │
  archived ───────────┤
    ↓                 │
  deleted ←───────────┘
```

**Transition Rules**:
- **draft → live**: Allowed when project has valid configuration (name, sharePath, theme)
- **draft → archived**: Allowed (skip live if project never activated)
- **draft → deleted**: Allowed (soft delete)
- **live → draft**: Allowed (revert to editing)
- **live → archived**: Allowed (end of campaign)
- **live → deleted**: Allowed (soft delete)
- **archived → live**: Allowed (reactivate campaign)
- **archived → deleted**: Allowed (soft delete)
- **deleted → (any)**: NOT allowed - soft delete is final (recovery requires manual intervention)

**Business Rules**:
- Only `live` projects are accessible to guests via sharePath
- `draft` projects are visible only in admin dashboard
- `archived` projects are read-only in admin dashboard
- `deleted` projects are hidden from admin dashboard (filtered by `deletedAt == null`)

## Migration Mapping

**From Event (v4) to Project (v5)**:

| Event Field (v4)     | Project Field (v5)   | Transformation             |
| -------------------- | -------------------- | -------------------------- |
| id                   | id                   | Preserved                  |
| name                 | name                 | Preserved                  |
| status               | status               | Preserved                  |
| ownerId              | companyId            | **Renamed**                |
| joinPath             | sharePath            | **Renamed**                |
| qrPngPath            | qrPngPath            | Preserved                  |
| publishStartAt       | publishStartAt       | Preserved (temporary)      |
| publishEndAt         | publishEndAt         | Preserved (temporary)      |
| activeJourneyId      | activeEventId        | **Renamed** (semantics TBD Phase 5) |
| theme                | theme                | Preserved (temporary)      |
| deletedAt            | deletedAt            | Preserved                  |
| createdAt            | createdAt            | Preserved                  |
| updatedAt            | updatedAt            | Preserved                  |

**Collection Path Migration**:
```
/events/{eventId} → /projects/{projectId}
```
Document IDs are preserved (eventId becomes projectId with same value).

## Data Validation

**Server-Side Validation** (required per Constitution Principle III):
- All Project mutations (create, update, delete) go through Server Actions
- Zod schemas validate input before Firestore writes
- Invalid data rejected with clear error messages

**Client-Side Validation** (optional, for UX):
- Form validation with Zod schemas for immediate feedback
- React Hook Form integration for field-level validation

**Validation Examples**:

```typescript
// Create Project - validation rules
const createProjectInput = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  companyId: z.string().nullable(),
  theme: projectThemeSchema.optional(), // Uses default if not provided
});

// Update Project - validation rules (partial)
const updateProjectInput = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["draft", "live", "archived"]).optional(),
  theme: projectThemeSchema.partial().optional(),
  publishStartAt: z.number().nullable().optional(),
  publishEndAt: z.number().nullable().optional(),
  activeEventId: z.string().nullable().optional(),
});
```

## Constants

```typescript
// Feature-local constants (features/projects/constants.ts)
export const NAME_LENGTH = {
  MIN: 1,
  MAX: 100,
} as const;

export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const PROJECT_STATUS = {
  DRAFT: "draft",
  LIVE: "live",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const SHARE_PATH_PREFIX = "/p/"; // Guest access URL prefix
export const QR_STORAGE_PATH = "media/{companyId}/qr/{projectId}.png";
```

## Performance Considerations

**Firestore Query Optimization**:
- Index on `companyId` for fast company-scoped lists
- Index on `sharePath` for instant guest access lookup
- Composite index on `status + updatedAt` for filtered/sorted admin lists
- Soft delete filter (`deletedAt == null`) applied at application level

**Storage Optimization**:
- QR codes stored once at project creation, regenerated only on sharePath change
- Theme assets (logos, background images) stored as full public URLs for instant rendering
- No signed URL generation required (reduces latency)

**Real-Time Subscriptions**:
- Projects List: Subscribe to filtered query (`companyId == activeCompany && deletedAt == null`)
- Project Details: Subscribe to single document (`/projects/{projectId}`)
- Minimize subscription scope to reduce bandwidth and client memory

## Next Steps

With data model complete, proceed to Phase 1 contract generation:
1. Generate API contracts for Server Actions (`contracts/`)
2. Generate `quickstart.md` with implementation overview
