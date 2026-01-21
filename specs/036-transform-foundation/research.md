# Research: Transform Pipeline Foundation & Schema

**Feature**: 036-transform-foundation
**Date**: 2026-01-20
**Status**: Complete

## Overview

This document captures research findings for implementing the transform pipeline foundation schemas. All "NEEDS CLARIFICATION" items from the spec have been resolved through user clarification sessions.

---

## Research Item 1: Shared Schema Location & Consolidation

**Question**: Where should shared schemas (job, session, experience, event) be defined given cloud functions need access?

**Decision**: Comprehensive shared kernel consolidation in `packages/shared/`

**Rationale**:
- Single source of truth for all pipeline-relevant schemas
- Both app and functions import from the same package
- Eliminates duplicate/outdated schemas across codebase
- Clear separation: base schemas in shared, step-specific configs in app domain

**Alternatives Considered**:
1. Duplicate schemas in app and functions - Rejected: maintenance nightmare, drift risk
2. Functions import from app - Rejected: wrong dependency direction, app shouldn't be a library
3. Shared types-only package - Rejected: Zod schemas are runtime, not just types
4. Minimal shared (job only) - Rejected: Session schema already outdated in shared, need full consolidation

**Implementation - Full Shared Kernel**:

| Schema | Location | Action |
|--------|----------|--------|
| Session | `schemas/session/session.schema.ts` | CONSOLIDATE from app (latest) + add jobStatus |
| Job | `schemas/job/job.schema.ts` | NEW |
| Experience | `schemas/experience/experience.schema.ts` | MOVE from app + add transform |
| Step (base) | `schemas/experience/step.schema.ts` | NEW (base only, add name) |
| Transform | `schemas/experience/transform.schema.ts` | NEW |
| Event | `schemas/event/project-event.schema.ts` | MOVE from app |
| EventConfig | `schemas/event/project-event-config.schema.ts` | MOVE from app |
| Project | `schemas/project/project.schema.ts` | MOVE from entities/ |
| Workspace | `schemas/workspace/workspace.schema.ts` | MOVE from entities/ |

**Structure**:
```text
packages/shared/src/schemas/
├── session/     # Full session with jobStatus
├── job/         # NEW: Transform job tracking
├── experience/  # Experience + base step + transform
├── event/       # Full event + config
├── project/     # Moved from entities
└── workspace/   # Moved from entities
```

**App Re-export Pattern**:
- App domain schema files become re-exports from `@clementine/shared`
- Step discriminated union (8 step configs) stays in app - not needed by functions
- Functions import directly from `@clementine/shared`

---

## Research Item 2: Job Document Snapshot Requirements

**Question**: What data should the job document snapshot at creation time?

**Decision**: Full execution context for reproducibility and debugging

**Rationale**:
- Snapshots ensure immutability - changes to experience/event after job creation don't affect execution
- Complete audit trail without querying other documents
- Debugging possible without reconstructing state from multiple collections
- Version numbers allow linking back to original documents if needed

**Data to Snapshot**:
```typescript
snapshot: {
  // Session inputs at job creation
  sessionInputs: {
    answers: Answer[]           // Copy from session.answers
    capturedMedia: CapturedMedia[]  // Copy from session.capturedMedia
  }

  // Transform configuration at job creation
  transformConfig: {
    nodes: TransformNode[]      // Pipeline node definitions
    variableMappings: VariableMapping[]  // Input variable bindings
    outputFormat: OutputFormat  // Final output format config
  }

  // Event overlay context
  eventContext: {
    overlaySettings: OverlaySettings | null
    applyOverlay: boolean
  }

  // Version tracking for audit
  versions: {
    experienceVersion: number   // From experience.publishedVersion
    eventVersion: number | null // If event has versioning
  }
}
```

**Alternatives Considered**:
1. Reference-only (just IDs) - Rejected: Requires querying multiple docs, state could change
2. Partial snapshot (only transform config) - Rejected: Incomplete for debugging
3. Full document copies - Rejected: Too much data duplication

---

## Research Item 3: Step Name Migration Strategy

**Question**: How should existing steps (created before name field) be migrated?

**Decision**: Lazy migration on first load/access

**Rationale**:
- No downtime or migration script required
- Self-healing as users naturally interact with experiences
- Simple implementation: check for null/undefined, generate if missing
- Persists on next edit, so migration is gradual and automatic

**Implementation Pattern**:
```typescript
// When loading a step that has no name
function ensureStepName(step: Step): Step {
  if (!step.name) {
    const displayName = stepRegistry[step.type].label
    const stepNumber = countStepsOfType(step.type) + 1
    return { ...step, name: `${displayName} ${stepNumber}` }
  }
  return step
}
```

**Alternatives Considered**:
1. One-time migration script - Rejected: Unnecessary complexity, downtime risk
2. Default empty string - Rejected: Empty names not useful for identification
3. Client-side only (never persist) - Rejected: Would regenerate numbers on each load

---

## Research Item 4: Session Job Progress Sync

**Question**: Should session sync job progress for real-time display?

**Decision**: No real-time progress sync - session only tracks `jobStatus`

**Rationale**:
- Guests see simple loading state, not detailed progress
- Reduces Firestore write frequency (job.progress updates frequently)
- Job document is the source of truth for detailed progress (admin/debug only)
- Client-side job subscription can be added later if needed for power users

**Session Fields**:
```typescript
session: {
  jobId: string | null      // Reference to active job
  jobStatus: JobStatus | null  // Synced from job.status (not progress)
}
```

**NOT in session**:
- `jobProgress` (use job document directly if needed)
- `jobError` (job document has full error details)

**Alternatives Considered**:
1. Full progress sync - Rejected: Too many writes, unnecessary for guests
2. Progress in session, error separate - Rejected: Inconsistent
3. No jobStatus, only jobId - Rejected: Requires additional query for simple status

---

## Research Item 5: Zod Patterns for New Schemas

**Question**: What Zod patterns should be used for new schemas to match existing code?

**Decision**: Follow established Firestore-safe patterns

**Key Patterns from Codebase**:

1. **Nullable defaults for optional fields** (Firestore doesn't support `undefined`):
   ```typescript
   transform: transformConfigSchema.nullable().default(null)
   ```

2. **Loose objects for forward compatibility**:
   ```typescript
   export const jobSchema = z.looseObject({ ... })
   ```

3. **Explicit defaults for required collections**:
   ```typescript
   answers: z.array(answerSchema).default([])
   ```

4. **Timestamps as Unix milliseconds**:
   ```typescript
   createdAt: z.number().int().positive()
   ```

5. **Factory functions for defaults**:
   ```typescript
   export function createDefaultTransformConfig(): TransformConfig {
     return { ... }
   }
   ```

**Implementation Notes**:
- Use `z.looseObject()` for all Firestore document schemas
- Never use `.optional()` - always `.nullable().default(null)`
- Enum values as `z.enum([...])` for status fields
- Include type exports: `export type X = z.infer<typeof xSchema>`

---

## Research Item 6: Firestore Security Rules Pattern

**Question**: What security rule pattern for job documents?

**Decision**: Admin read, server-only write

**Rule Structure**:
```
match /projects/{projectId}/jobs/{jobId} {
  // READ: Admins only (jobs contain sensitive execution details)
  allow read: if isAdmin();

  // WRITE: Server only via Admin SDK (never client)
  allow create, update, delete: if false;
}
```

**Rationale**:
- Jobs are internal execution records, not user-facing data
- Guests don't need direct job access - they see session.jobStatus
- Admins may want to debug/inspect job execution
- All writes via Cloud Functions ensures validation and integrity

**Alternatives Considered**:
1. Authenticated users read own jobs - Rejected: Unnecessary exposure
2. No read access - Rejected: Admins need debugging capability
3. Subcollection under sessions - Rejected: Jobs are project-scoped, not session-scoped

---

## Research Item 7: Step Name Auto-Generation Format

**Question**: How should auto-generated step names be formatted?

**Decision**: "{StepTypeDisplayName} {N}" where N is count of that step type

**Examples**:
- First Photo Capture → "Photo Capture 1"
- Second Photo Capture → "Photo Capture 2"
- First Opinion Scale → "Opinion Scale 1"

**Display Names** (from step registry):
| Step Type | Display Name |
|-----------|-------------|
| `info` | Information |
| `input.scale` | Opinion Scale |
| `input.yesNo` | Yes/No |
| `input.multiSelect` | Multiple Choice |
| `input.shortText` | Short Answer |
| `input.longText` | Long Answer |
| `capture.photo` | Photo Capture |
| `transform.pipeline` | AI Transform |

**Implementation**:
- Count is per step type, not global
- Count is within current draft config, not all-time
- Names are not unique (duplicates allowed - IDs remain unique identifier)

---

## Research Item 8: TransformConfig Schema Structure

**Question**: What fields should TransformConfig contain for future phases?

**Decision**: Minimal structure now, extensible for future phases

**Initial Schema**:
```typescript
export const transformConfigSchema = z.looseObject({
  // Node definitions for the pipeline graph
  nodes: z.array(transformNodeSchema).default([]),

  // Variable bindings from session data to node inputs
  variableMappings: z.array(variableMappingSchema).default([]),

  // Output format configuration
  outputFormat: outputFormatSchema.nullable().default(null),
})
```

**Why Minimal**:
- This phase establishes the slot in experience config
- Detailed node/mapping schemas are future phase work
- `z.looseObject()` allows forward-compatible additions

**Future Extension Points**:
- `nodes` array will contain pipeline graph definition
- `variableMappings` will map step answers/captures to node inputs
- `outputFormat` will specify final output (image/gif/video, dimensions, etc.)

---

## Summary of Resolved Clarifications

| Item | Resolution |
|------|------------|
| Schema location | Full shared kernel consolidation in `packages/shared/` |
| Consolidation scope | Session, Job, Experience, Event, Project, Workspace schemas |
| Step schemas | Base step in shared (with name), discriminated union stays in app |
| Folder structure | Grouped by domain: `schemas/{session,job,experience,event,project,workspace}/` |
| Job snapshot | Full execution context (inputs, config, event context, versions) |
| Step migration | Lazy migration - generate name on first load, persist on edit |
| Session progress | `jobStatus` only, no `jobProgress` (detailed progress in job doc) |
| Zod patterns | Nullable defaults, looseObject, factory functions |
| Security rules | Admin read, server-only write |
| Name format | "{DisplayName} {N}" per step type |
| TransformConfig | Minimal with nodes, variableMappings, outputFormat placeholders |

---

## Dependencies Identified

No external dependencies required for this phase. All work uses existing:
- Zod 4.1.12 (already installed)
- Firebase Firestore (client + Admin SDK already configured)
- TypeScript strict mode (already enabled)

## Impact Assessment

### Breaking Changes
- Import paths change from app domains to `@clementine/shared`
- `packages/shared/src/entities/` folder removed (moved to `schemas/`)
- Old `session.schemas.ts` replaced by consolidated `session/session.schema.ts`

### Migration Required
- Update all imports in app to use shared or domain re-exports
- Update all imports in functions to use shared
- Remove old schema files after re-exports are in place

### No Breaking Changes
- Schema shapes are unchanged (except additive fields)
- Firestore documents remain compatible
- Existing data requires no migration

## Next Steps

Proceed to Phase 1 with data-model.md creation.
