# Research: Session Result Media Schema Alignment

**Feature**: 064-session-result-media
**Date**: 2026-02-06

## Research Summary

All unknowns have been resolved through codebase analysis. No external research was needed — this is a purely internal schema alignment task.

---

## R1: Field Mapping — sessionResultMediaSchema → mediaReferenceSchema

### Decision

Map fields as follows:

| Old Field (sessionResultMediaSchema) | New Field (mediaReferenceSchema) | Migration Notes |
|--------------------------------------|----------------------------------|-----------------|
| `assetId: z.string()` | `mediaAssetId: z.string()` | Rename only — same value (`${sessionId}-output`) |
| `url: z.string()` | `url: z.url()` | Same value, stricter validation (`z.url()` vs `z.string()`) |
| *(not present)* | `filePath: z.string().nullable().default(null)` | New field — storage path available at write time from `getOutputStoragePath()` |
| *(not present)* | `displayName: mediaDisplayNameSchema` | New field — default to "Result" via `.catch('Untitled')` built into schema |
| `stepId: z.string()` | *(dropped)* | Not needed — always "create"; step origin available via session.responses |
| `createdAt: z.number()` | *(dropped)* | Not needed — session.updatedAt/completedAt serve same purpose |

### Rationale

- `mediaReferenceSchema` is the established standard for all media references in the system (theme backgrounds, overlays, capture responses)
- The `filePath` field enables `getStoragePathFromMediaReference()` utility to work with result media, eliminating the need to parse URLs
- `displayName` defaults are already handled by `mediaDisplayNameSchema.catch('Untitled')` — no special handling needed
- `stepId` was always hardcoded to `'create'` in the only writer; no consumer reads this field
- `createdAt` is redundant with session-level timestamps

### Alternatives Considered

1. **Extend mediaReferenceSchema with stepId/createdAt**: Rejected — would pollute the standard schema with session-specific fields and defeat the purpose of standardization
2. **Create sessionMediaReferenceSchema as superset**: Rejected — adds another schema variant rather than reducing them (violates Principle II: Simplicity)
3. **Keep both schemas, add adapter layer**: Rejected — adds complexity without benefit; the goal is to reduce to one format

---

## R2: Backward Compatibility Strategy

### Decision

Use Zod's built-in `looseObject()` and `.catch()` for zero-migration backward compatibility.

### How It Works

`mediaReferenceSchema` already uses `z.looseObject()`, which means:
- **Legacy documents** (with `stepId`, `assetId`, `createdAt` but missing `mediaAssetId`, `filePath`, `displayName`) will fail strict validation
- **Solution**: Use `mediaReferenceSchema` with a preprocessing step or use a session-specific nullable wrapper that handles the transition

**Approach**: Since `resultMedia` is nullable at the session level, and the `sessionSchema` uses `z.looseObject()` (which means extra fields like `stepId`/`createdAt` on legacy docs are ignored), the key issue is that legacy docs have `assetId` instead of `mediaAssetId` and lack `displayName`.

**Practical solution**: Replace `sessionResultMediaSchema` in the session schema with `mediaReferenceSchema`. For the transition period, legacy documents will be parsed through `sessionSchema`'s `looseObject()` — but the `resultMedia` field itself will need a migration-aware wrapper.

**Recommended approach**: Use `z.preprocess()` or a custom transform to normalize legacy data:
- If `assetId` exists but `mediaAssetId` doesn't → copy `assetId` to `mediaAssetId`
- If `displayName` is missing → defaults to 'Untitled' via `.catch()`
- If `filePath` is missing → defaults to `null`

### Rationale

- Zero-downtime: no batch migration needed
- Existing Firestore documents are never rewritten
- New writes always use the standard format
- Legacy documents are normalized transparently on read

### Alternatives Considered

1. **Batch migration script**: Rejected — requires downtime or complex dual-write logic; existing document volume doesn't justify the complexity
2. **Ignore legacy documents**: Rejected — would break existing sessions

---

## R3: Writer Analysis — Who Writes resultMedia?

### Decision

Only **one writer** needs to be updated: `transformPipelineJob.ts` → `updateSessionResultMedia()`.

### Findings

| Writer | Location | Change Needed |
|--------|----------|---------------|
| `transformPipelineJob.ts:173-178` | `functions/src/tasks/` | YES — change field names and add filePath/displayName |
| `updateSessionResultMedia()` | `functions/src/repositories/session.ts:84-93` | YES — change parameter type from `SessionResultMedia` to `MediaReference` |
| `useCreateSession.ts:90` | `apps/clementine-app/src/domains/session/` | NO — already writes `null` |
| `seed-emulators.ts:335+` | `functions/scripts/` | NO — already writes `null` |
| `experienceRuntimeStore.ts:222` | Client-side state only | YES — update type signature |

### Rationale

The architecture is well-contained: one Cloud Function writes the actual result media, routed through one repository function. All other code either writes `null` (initialization) or manages client-side state.

---

## R4: Consumer Analysis — Who Reads resultMedia?

### Decision

**Three consumers** need type updates; **one consumer** needs no code changes.

### Findings

| Consumer | Location | Field(s) Accessed | Change Needed |
|----------|----------|-------------------|---------------|
| `SharePage.tsx:73` | `apps/.../guest/containers/` | `.url` only | NO — `url` field exists on both schemas |
| `useShareActions.ts:36` | `apps/.../guest/hooks/` | `mediaUrl` param (from `.url`) | NO — receives URL string, not schema object |
| `experienceRuntimeStore.ts:38,82,215` | `apps/.../experience/runtime/stores/` | Full type in state definition | YES — update type from `SessionResultMedia` to `MediaReference` |
| `runtime.types.ts:10,28` | `apps/.../experience/shared/types/` | Type in interface | YES — update type from `SessionResultMedia` to `MediaReference` |
| `useRuntime.ts:217` | `apps/.../experience/runtime/hooks/` | `store.resultMedia` | NO — uses RuntimeState, auto-resolved |
| `session/shared/schemas/index.ts:17,25` | Barrel export | Re-export | YES — remove sessionResultMediaSchema/SessionResultMedia re-exports |

### Rationale

The SharePage (primary guest-facing consumer) only accesses `.url`, which exists on both the old and new schemas. No UI code changes are needed there. The type-level changes in the runtime store and types will be caught by TypeScript's strict mode during compilation.

---

## R5: filePath Availability at Write Time

### Decision

The `filePath` (storage path) **is available** at the point where resultMedia is written and SHOULD be included.

### Findings

In `imageOutcome.ts:261-267`, the `storagePath` is computed via `getOutputStoragePath()` before uploading:
```
const storagePath = getOutputStoragePath(projectId, sessionId, 'output', 'jpg')
const url = await uploadToStorage(outputPath, storagePath)
```

Currently, `storagePath` is used for the upload but not returned in `JobOutput`. To include it in the result media, we need to either:
1. Return `storagePath` in `JobOutput` (adds a field to the shared schema)
2. Recompute it in `transformPipelineJob.ts` using `getOutputStoragePath()`

### Rationale

Option 2 (recompute) is simpler — `getOutputStoragePath()` is a pure function that takes `projectId`, `sessionId`, type, and extension. The caller already has `projectId` and `sessionId`. The format is always `'jpg'` for image outcomes. This avoids modifying `JobOutput` schema.

### Alternatives Considered

1. **Add filePath to JobOutput schema**: Rejected — changes a shared schema for one consumer's benefit; the storage path can be derived from existing data
2. **Parse URL to get storage path**: Rejected — fragile; `getOutputStoragePath()` is the canonical source
