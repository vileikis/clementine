# Research: Media Assets Shared Schema

**Feature**: 040-media-assets-shared
**Date**: 2026-01-26

## Research Questions

### 1. How should schemas be organized in packages/shared?

**Decision**: Create new `media/` domain folder in `packages/shared/src/schemas/`

**Rationale**:
- Follows existing domain-driven organization (session/, job/, experience/, event/, theme/, etc.)
- Each domain has its own folder with barrel exports via `index.ts`
- Maintains consistency with established patterns

**Alternatives Considered**:
- Keep media schemas in `theme/` folder → Rejected: media is a distinct domain, not theme-specific
- Create flat files in schemas root → Rejected: Violates domain organization pattern

### 2. How should mediaReferenceSchema be structured?

**Decision**:
```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.string().url(),
  filePath: z.string().nullable().default(null),
})
```

**Rationale**:
- `mediaAssetId`: Required for document tracking/management
- `url`: Required for client-side rendering (immediate display)
- `filePath`: Nullable for backward compatibility with existing documents, populated on new uploads
- `looseObject`: Forward compatibility with future fields

**Alternatives Considered**:
- Make filePath required → Rejected: Would break existing documents without data migration
- Omit filePath entirely → Rejected: Cloud functions need it for direct storage access
- Add workspaceId to reference → Rejected: Over-engineering, can derive from document path

### 3. How should existing schema duplicates be refactored?

**Decision**: Replace with imports from central `media/` domain

**Files to Update**:
| Current Location | Current Schema | Action |
|------------------|----------------|--------|
| `theme/media-reference.schema.ts` | `mediaReferenceSchema` | Move to `media/`, re-export from theme/ |
| `event/project-event-config.schema.ts` | `overlayReferenceSchema` | Replace with `mediaReferenceSchema` |
| `experience/experience.schema.ts` | `experienceMediaSchema` | Replace with `mediaReferenceSchema` |
| `experience/steps/info.schema.ts` | `experienceMediaAssetSchema` | Replace with `mediaReferenceSchema` |

**Backward Compatibility**:
- Re-export `mediaReferenceSchema` from `theme/index.ts`
- Export type aliases: `OverlayReference = MediaReference`
- Keep `overlayReferenceSchema` as alias pointing to `mediaReferenceSchema.nullable()`

### 4. How should the upload service be structured?

**Decision**: Extract upload orchestration into standalone service function

**Service Interface**:
```typescript
interface UploadMediaAssetParams {
  file: File
  type: MediaAssetType
  workspaceId: string
  userId: string
  onProgress?: (progress: number) => void
}

interface UploadMediaAssetResult {
  mediaAssetId: string
  url: string
  filePath: string
}

export async function uploadMediaAsset(
  params: UploadMediaAssetParams
): Promise<UploadMediaAssetResult>
```

**Rationale**:
- Pure function enables unit testing without React/Query context
- Hook becomes thin wrapper: `useMutation({ mutationFn: uploadMediaAsset })`
- Maintains progress callback for UI integration
- Returns `filePath` for new upload behavior

### 5. What validation tests are needed?

**Decision**: Create `media-asset.schema.test.ts` with tests for:

1. **Schema parsing**: Valid MediaAsset documents parse correctly
2. **Backward compatibility**: Documents without `filePath` parse with null default
3. **MIME type validation**: Only allowed types pass validation
4. **URL validation**: Invalid URLs are rejected
5. **Required fields**: Missing required fields fail validation

**Test Patterns**:
- Follow existing patterns in `theme.schema.test.ts` and `project-event-config.schema.test.ts`
- Use Vitest (shared package testing framework)

## Existing Patterns Reference

### Schema File Pattern
```typescript
/**
 * Schema Name
 *
 * Description and Firestore path.
 */
import { z } from 'zod'

export const schemaName = z.looseObject({
  field: z.string(),
  optionalField: z.string().nullable().default(null),
})

export type SchemaName = z.infer<typeof schemaName>
```

### Barrel Export Pattern
```typescript
// domain/index.ts
export * from './schema1.schema'
export * from './schema2.schema'
```

### Consumer Import Pattern
```typescript
import { schemaName, type SchemaName } from '@clementine/shared'
```

## Dependencies

| Dependency | Version | Usage |
|------------|---------|-------|
| zod | 4.1.12 | Schema validation |
| vitest | latest | Testing |
| @clementine/shared | workspace | Schema package |

## Resolved Clarifications

All technical decisions were made during spec creation:
- ✅ Include `filePath` in media reference (nullable)
- ✅ Use `looseObject` for forward compatibility
- ✅ No data migration required
- ✅ Include refactoring of cloud functions and app in scope
