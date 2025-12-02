# Research: Experience Library

**Feature**: 015-experience-library
**Date**: 2025-12-02

## Overview

This research consolidates findings for the Experience Library feature. Since we're refactoring an existing journeys module with proven patterns, minimal research was needed.

---

## Decision 1: Feature Module Structure

**Decision**: Copy and refactor the existing `journeys` feature module to create `experiences`

**Rationale**:
- Journeys module is battle-tested with complete CRUD operations, real-time updates, and editor functionality
- Follows existing `standards/global/feature-modules.md` vertical slice architecture
- Minimizes risk by reusing proven patterns

**Alternatives Considered**:
1. **Build from scratch** - Rejected: Unnecessary effort, higher risk of bugs
2. **Extend journeys module** - Rejected: Would create confusion between event-scoped and company-scoped concepts

---

## Decision 2: Firestore Collection Structure

**Decision**: Top-level `/experiences` collection with steps as subcollection

**Structure**:
```
/experiences/{experienceId}
/experiences/{experienceId}/steps/{stepId}
```

**Rationale**:
- Aligns with target architecture in `features/scalable-arch/new-data-model-v5.md`
- Company scoping via `companyId` field (no nested collections under companies)
- Steps remain subcollection for atomic operations and query efficiency

**Alternatives Considered**:
1. **Nested under companies** (`/companies/{companyId}/experiences`) - Rejected: Firestore best practice favors flat collections with ID references
2. **Steps as separate root collection** - Rejected: Steps are tightly coupled to experiences, subcollection is cleaner

---

## Decision 3: Routing Pattern

**Decision**: Use existing `/exps` route structure (already configured in navigation)

**Routes**:
- `/{companySlug}/exps` - Experience list
- `/{companySlug}/exps/{expId}` - Experience editor

**Rationale**:
- Routes and navigation already exist (just placeholders)
- Short URL path `/exps` is already configured in sidebar constants
- Minimal changes required

**Alternatives Considered**:
1. **`/experiences` full path** - Rejected: Longer URLs, would require navigation constant changes

---

## Decision 4: Step Type Filtering

**Decision**: Filter deprecated step types in `STEP_TYPE_META` constant

**Deprecated Types**:
- `experience-picker` - No longer needed in new flow

**Rationale**:
- Steps module already has `STEP_TYPE_META` with `deprecated` flag capability
- Minimal change: add/set `deprecated: true` flag, filter in UI

**Implementation**:
```typescript
// In steps/constants.ts
{ type: 'experience-picker', ..., deprecated: true }

// In StepTypeSelector
const availableTypes = STEP_TYPE_META.filter(t => !t.deprecated);
```

---

## Decision 5: Real-time Updates Pattern

**Decision**: Use Firebase Client SDK `onSnapshot` for experience list (same as journeys)

**Rationale**:
- Consistent with existing journeys `useSteps` hook pattern
- Constitution VI mandates Client SDK for real-time subscriptions
- Provides instant UI updates when experiences are created/modified

**Implementation**:
- `useExperiences(companyId)` hook with `onSnapshot` subscription
- Query: `where("companyId", "==", companyId)` and `where("status", "==", "active")`

---

## Decision 6: Experience Schema

**Decision**: Adapt Journey schema with company scoping

**Experience Schema**:
```typescript
interface Experience {
  id: string;
  companyId: string;        // NEW: Company scope
  name: string;             // 1-200 chars
  description?: string | null;
  stepsOrder: string[];     // Ordered step IDs
  status: "active" | "deleted";
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
  // Future fields (not used in MVP):
  // isPublic?: boolean;
  // previewMedia?: string;
}
```

**Rationale**:
- Mirrors Journey structure for easy refactoring
- `companyId` replaces `eventId` for scoping
- Soft delete pattern preserved

---

## Decision 7: Step Schema Updates

**Decision**: Steps remain unchanged except for path references

**Changes**:
- Remove `eventId` field
- `journeyId` renamed to `experienceId`
- Collection path: `/experiences/{experienceId}/steps/{stepId}`

**Rationale**:
- Step types and configurations are experience-agnostic
- Existing step editors and previews work unchanged
- Only repository paths and type references need updates

---

## Key Findings Summary

| Topic | Decision | Risk Level |
| ----- | -------- | ---------- |
| Module structure | Copy/refactor journeys | Low |
| Firestore paths | Top-level `/experiences` | Low |
| Routing | Use existing `/exps` routes | Low |
| Deprecated steps | Filter via `deprecated` flag | Low |
| Real-time updates | `onSnapshot` subscription | Low |
| Experience schema | Journey + companyId | Low |
| Step schema | Minimal changes | Low |

**Overall Risk**: Low - leveraging existing proven patterns with minimal architectural changes.
