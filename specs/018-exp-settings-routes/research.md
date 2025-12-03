# Research: Experience Editor Tabs (Design & Settings)

**Feature Branch**: `001-exp-settings-routes`
**Date**: 2025-12-03
**Status**: Complete

## Executive Summary

Research complete with all technical decisions resolved. The codebase already has established patterns for all required functionality:
- Tab navigation component exists (`ExperienceTabs.tsx`)
- Media upload patterns established (`StepMediaUpload.tsx`)
- Server action patterns with Zod validation in place
- Route structure patterns available from events module

---

## Research Findings

### 1. Routing Patterns for Nested Tabs

**Decision**: Use Next.js App Router nested route segments with shared layout

**Rationale**:
- Follows existing pattern from events module (`[eventId]/layout.tsx`)
- Preserves URL history for browser back/forward navigation
- Enables server-side data fetching per route segment
- `ExperienceTabs.tsx` component already implements Link-based navigation

**Alternatives Considered**:
- Client-side tab state: Rejected - no URL persistence, poor bookmarking
- shadcn/ui Tabs component: Not used in codebase; Link-based approach preferred

**Implementation Reference**:
- Pattern: `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/layout.tsx`
- Tabs: `web/src/features/experiences/components/editor/ExperienceTabs.tsx`

---

### 2. File Upload for Preview Media

**Decision**: Reuse existing media upload patterns from steps module

**Rationale**:
- `StepMediaUpload.tsx` handles all required file types (JPEG, PNG, WebP, GIF)
- Upload action (`uploadStepMedia`) already implements Firebase Storage
- Pattern generates public URLs directly (per constitution FAR-004)
- Validation utilities exist in `media-validation.ts`

**Alternatives Considered**:
- New dedicated upload component: Rejected - duplication of existing patterns
- Direct Firebase Storage client upload: Rejected - constitution requires Admin SDK for writes

**Implementation Reference**:
- Component: `web/src/features/steps/components/shared/StepMediaUpload.tsx`
- Action: `web/src/features/steps/actions/step-media.ts`
- Validation: `web/src/features/steps/utils/media-validation.ts`

**Storage Path Pattern**:
```
media/{companyId}/experiences/{timestamp}-{sanitizedFilename}
```

---

### 3. Experience Settings Server Action

**Decision**: Extend existing `updateExperienceAction` or create dedicated settings action

**Rationale**:
- Existing schema already supports `name` and `description` updates
- Need to add `previewMediaUrl` and `previewType` fields
- Follows established action pattern with auth, validation, repository layers

**Alternatives Considered**:
- Separate action per field: Rejected - unnecessary complexity
- Combined with media upload: Rejected - separation of concerns

**Implementation Reference**:
- Action: `web/src/features/experiences/actions/experiences.ts`
- Schema: `web/src/features/experiences/schemas/experiences.schemas.ts`

---

### 4. Experience Type Extension

**Decision**: Add optional preview media fields to Experience interface

**Rationale**:
- Follows v5 data model pattern from `new-data-model-v5.md`
- Fields are optional to maintain backward compatibility
- Type discrimination via `previewType` for rendering logic

**New Fields**:
```typescript
previewMediaUrl?: string | null;  // Full public URL
previewType?: "image" | "gif" | null;
```

**Implementation Reference**:
- Types: `web/src/features/experiences/types/experiences.types.ts`
- Schema: `web/src/features/experiences/schemas/experiences.schemas.ts`

---

### 5. Tab Navigation Component

**Decision**: Use existing `ExperienceTabs` component (already implemented)

**Rationale**:
- Component already exists at `ExperienceTabs.tsx`
- Already defines both Design and Settings tab routes
- Follows accessibility patterns (ARIA, keyboard nav)
- Matches codebase styling conventions

**No Additional Work Required**: Component ready for use.

---

### 6. Settings Form Pattern

**Decision**: Follow ThemeEditor pattern with useReducer and save button

**Rationale**:
- ThemeEditor provides proven pattern for form state management
- `useReducer` handles complex state updates cleanly
- Save button provides explicit control (vs auto-save complexity)
- Toast notifications via sonner for feedback

**Alternatives Considered**:
- Auto-save on blur: Rejected - adds complexity, potential data loss on rapid changes
- react-hook-form: Could work, but useReducer pattern is established in codebase

**Implementation Reference**:
- Pattern: `web/src/features/projects/components/designer/ThemeEditor.tsx`
- Toast: sonner library (already in use)

---

### 7. ExperienceCard Preview Media Display

**Decision**: Extend ExperienceCard to show preview thumbnail when available

**Rationale**:
- Cards currently show only text (name, step count, date)
- Adding visual thumbnail improves experience identification
- Fallback to icon/placeholder when no media

**Rendering Logic**:
```typescript
if (experience.previewMediaUrl && experience.previewType === "image") {
  // Show image thumbnail with aspect-ratio container
} else if (experience.previewMediaUrl && experience.previewType === "gif") {
  // Show static first frame or animated (TBD based on performance)
} else {
  // Show fallback icon/placeholder
}
```

**Implementation Reference**:
- Component: `web/src/features/experiences/components/ExperienceCard.tsx`
- Next.js Image: Use `next/image` for optimized loading

---

## Technical Constraints Confirmed

| Constraint | Value | Source |
|-----------|-------|--------|
| File size limit | 5MB (images), 10MB (GIF) | `media-validation.ts` |
| Name length | 1-200 characters | `EXPERIENCE_CONSTRAINTS` |
| Description length | 0-1000 characters | `EXPERIENCE_CONSTRAINTS` |
| Supported formats | JPEG, PNG, WebP, GIF | `media-validation.ts` |
| Touch target size | 44x44px minimum | Constitution §I |

---

## Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| next | 16.x | App Router, Image optimization |
| zod | 4.x | Schema validation |
| sonner | existing | Toast notifications |
| lucide-react | existing | Icons |
| Firebase Storage | existing | Media file storage |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Route redirect breaks existing links | Low | Medium | Implement redirect from base URL to /design |
| Large media files slow page load | Medium | Low | Use Next.js Image optimization, lazy loading |
| Real-time sync conflicts | Low | Low | Use timestamp-based updatedAt checks |

---

## Next Steps

1. **Phase 1**: Create data-model.md with Experience type extensions
2. **Phase 1**: Generate API contracts for settings endpoints
3. **Phase 1**: Update agent context with feature-specific patterns
4. Continue to `/speckit.tasks` for implementation task breakdown
