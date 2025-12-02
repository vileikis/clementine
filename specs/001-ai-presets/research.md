# Research: AI Presets Refactor & Legacy Step Stabilization

**Branch**: `001-ai-presets` | **Date**: 2025-12-02

## Overview

This document captures research findings for the experiences → aiPresets refactor. Since this is a pure rename/refactor operation, research focuses on:

1. Current codebase state and dependencies
2. Best practices for Firestore collection migration
3. TypeScript refactoring patterns

## 1. Current Experiences Feature Analysis

### Decision: Rename feature module in place

**Rationale**: The existing `features/experiences/` module follows the Feature Module Architecture constitution principle. Renaming it to `features/ai-presets/` preserves the structure while freeing the "Experience" term.

**Alternatives Considered**:
- Create new `ai-presets` module and deprecate old → Rejected: Would require maintaining two modules during transition
- Keep module name, only rename types → Rejected: Creates confusion between module name and type names

### Current Structure Findings

| Component | Current Name | New Name |
|-----------|--------------|----------|
| Firestore collection | `/experiences` | `/aiPresets` |
| Feature module | `features/experiences/` | `features/ai-presets/` |
| Main type | `Experience` | `AiPreset` |
| Repository | `experiences.repository.ts` | `ai-presets.repository.ts` |
| Schemas | `experiences.schemas.ts` | `ai-presets.schemas.ts` |

### Type Definitions (to be renamed)

| Current Type | New Type |
|--------------|----------|
| `Experience` | `AiPreset` |
| `PhotoExperience` | `PhotoAiPreset` |
| `VideoExperience` | `VideoAiPreset` |
| `GifExperience` | `GifAiPreset` |
| `ExperienceType` | `AiPresetType` |

### Repository Functions (to be renamed)

| Current Function | New Function |
|-----------------|--------------|
| `getExperience()` | `getAiPreset()` |
| `getExperiencesByEventId()` | `getAiPresetsByEventId()` |
| `getExperiencesByCompanyId()` | `getAiPresetsByCompanyId()` |
| `createPhotoExperience()` | `createPhotoAiPreset()` |
| `createGifExperience()` | `createGifAiPreset()` |
| `updateExperience()` | `updateAiPreset()` |
| `deleteExperience()` | `deleteAiPreset()` |
| `duplicateExperience()` | `duplicateAiPreset()` |

## 2. Firestore Migration Strategy

### Decision: Copy documents to new collection (keep old as backup)

**Rationale**: Firestore doesn't support collection rename. Copying preserves data and allows rollback if issues arise.

**Alternatives Considered**:
- In-place updates with dual-path read logic → Rejected: Adds complexity, harder to verify migration success
- Delete old collection immediately → Rejected: No rollback path if migration has issues

### Migration Approach

1. **Pre-migration**: Count documents in `/experiences`
2. **Migration**: Batch copy all documents to `/aiPresets` (preserve document IDs)
3. **Verification**: Count documents in `/aiPresets`, compare
4. **Cutover**: Deploy code changes pointing to new collection
5. **Cleanup** (later): Delete `/experiences` after confirming stability

### Batch Size Considerations

- Firestore batch limit: 500 operations
- For large collections, use batched writes with chunking
- Current expectation: <100 documents (batch safe)

## 3. Step Deprecation Strategy

### Decision: Add `deprecated` flag to StepTypeMeta, filter in UI

**Rationale**: Minimal code change, clear intent, preserves backward compatibility for existing steps.

**Alternatives Considered**:
- Remove step types entirely from schemas → Rejected: Breaks existing journeys
- Create separate "legacy" step category → Rejected: Over-engineering for deprecation

### Steps to Deprecate

| Step Type | Reason |
|-----------|--------|
| `experience-picker` | Replaced by new Experience system in Phase 2+ |
| `capture` | References aiPresets, will be redesigned in Phase 2+ |

### Implementation Details

```typescript
// Add to StepTypeMeta interface
export interface StepTypeMeta {
  type: StepType;
  label: string;
  description: string;
  category: "navigation" | "capture" | "input" | "completion";
  deprecated?: boolean;  // NEW
}

// Mark in STEP_TYPE_META
{
  type: "experience-picker",
  label: "Experience Picker",
  description: "Choose an AI experience",
  category: "navigation",
  deprecated: true,  // NEW
},
{
  type: "capture",
  label: "Capture",
  description: "Take a photo or video",
  category: "capture",
  deprecated: true,  // NEW
},
```

## 4. Import Update Strategy

### Decision: Use IDE rename refactoring + manual verification

**Rationale**: TypeScript/IDE refactoring handles most import updates automatically. Manual pass catches edge cases.

**Alternatives Considered**:
- Manual find-replace → Rejected: Error-prone, misses type references
- AST-based codemods → Rejected: Overkill for this scope

### Files Requiring Updates (14 total)

**App Routes** (1 file - only public routes):
- `app/(public)/join/[eventId]/page.tsx`

**Feature Modules** (13 files):
- `features/guest/` - 2 files
- `features/journeys/` - 3 files
- `features/sessions/` - 1 file
- `features/steps/` - 7 files

### Verification Checklist

After refactor, run:
```bash
# Check for old import paths
grep -r "@/features/experiences" web/src/

# Check for old collection name
grep -r '"experiences"' web/src/

# Check for old type names
grep -r "Experience\b" web/src/ --include="*.ts" --include="*.tsx"
```

## 5. Scope Constraint Verification

### DO NOT TOUCH: `web/src/app/(workspace)/`

Verified: No files in `(workspace)/` import from the experiences feature. The experiences feature is only used in:
- Public guest routes: `(public)/join/`
- Admin routes: `(admin)/events/` (note: NOT in workspace group)

### Constraint Compliance

| Area | Status |
|------|--------|
| `app/(workspace)/` | ✅ Not touched - no experiences imports found |
| `app/(public)/` | ✅ Will update imports |
| `features/experiences/` | ✅ Will rename to `ai-presets/` |

## Summary

All research questions resolved. No clarifications needed. Ready for Phase 1 design artifacts.

| Topic | Decision |
|-------|----------|
| Feature module | Rename in place to `ai-presets/` |
| Firestore migration | Copy to `/aiPresets`, keep backup |
| Type renaming | Experience → AiPreset (all variants) |
| Step deprecation | Add `deprecated` flag, filter in UI |
| Import updates | IDE refactor + verification grep |
