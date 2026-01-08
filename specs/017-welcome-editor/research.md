# Research: Welcome Editor

**Feature**: 017-welcome-editor
**Date**: 2026-01-07

## Research Summary

This feature requires no external research as it follows established patterns in the codebase. All technical decisions have been validated against existing implementations.

---

## 1. Editor Pattern (Theme Editor Reference)

**Decision**: Follow ThemeEditorPage.tsx pattern exactly

**Rationale**:
- Proven 2-column layout with live preview
- Auto-save with debounce already handles performance
- useTrackedMutation integration provides save indicator
- useWatch enables real-time preview updates

**Alternatives Considered**:
- Form submission pattern: Rejected - breaks real-time preview expectation
- Separate save button: Rejected - inconsistent with Theme Editor UX

**Reference Files**:
- `apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx`
- `apps/clementine-app/src/domains/event/theme/components/ThemeControls.tsx`
- `apps/clementine-app/src/domains/event/theme/components/ThemePreview.tsx`

---

## 2. Themed Primitives Integration

**Decision**: Use ThemedBackground + ThemedText for preview rendering

**Rationale**:
- ThemedBackground handles all background styling (color, image, overlay)
- ThemedText applies theme colors, fonts, and alignment
- Both support direct theme prop (no ThemeProvider needed for preview)

**Alternatives Considered**:
- Custom styling: Rejected - would duplicate ThemedBackground logic
- ThemeProvider wrapper: Rejected - direct prop is simpler for isolated preview

**Reference Files**:
- `apps/clementine-app/src/shared/theming/components/ThemedBackground.tsx`
- `apps/clementine-app/src/shared/theming/components/primitives/ThemedText.tsx`

---

## 3. Schema Design

**Decision**: Add welcomeConfigSchema to project-event-config.schema.ts

**Rationale**:
- Consistent with theme, overlays, sharing schemas
- Uses nullable().default(null) pattern for optional sections
- Reuses mediaReferenceSchema from @/shared/theming

**Schema Structure**:
```typescript
welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  layout: z.enum(['list', 'grid']).default('list'),
})
```

**Alternatives Considered**:
- Separate collection: Rejected - welcome is part of event config
- Nested deeply: Rejected - flat structure matches other config sections

---

## 4. Editor Controls Selection

**Decision**: Use existing shared editor controls

| Field | Control | Component |
|-------|---------|-----------|
| Title | Text input | shadcn/ui Input |
| Description | Multiline text | shadcn/ui Textarea |
| Hero Image | Media picker | MediaPickerField |
| Layout | Toggle group | ToggleGroupField |

**Rationale**:
- All controls already exist and are battle-tested
- Consistent look and feel with Theme Editor
- EditorSection/EditorRow provide proper layout

**Reference Files**:
- `apps/clementine-app/src/shared/editor-controls/components/`

---

## 5. Media Upload Flow

**Decision**: Create useUploadAndUpdateHeroMedia composite hook

**Rationale**:
- Matches useUploadAndUpdateBackground pattern
- Combines media upload + config update atomically
- Provides progress callback for UI feedback

**Flow**:
1. User drops/selects image file
2. useUploadMediaAsset uploads to Firebase Storage
3. Returns { mediaAssetId, url }
4. useUpdateWelcome saves to event config
5. Preview updates via useWatch

**Alternatives Considered**:
- Two separate calls in component: Rejected - harder to manage loading states
- Single endpoint: Rejected - over-engineering for client-first architecture

---

## 6. Auto-save Configuration

**Decision**: 300ms debounce with field-level change detection

**Rationale**:
- Matches Theme Editor behavior
- Fast enough for responsiveness, slow enough for typing
- Only saves when actual changes detected

**Fields to Compare**:
```typescript
['title', 'description', 'media', 'layout']
```

---

## 7. Preview Layout

**Decision**: Vertical stack with hero, title, description, placeholder

**Layout**:
```
┌─────────────────────────────────────────────┐
│  [ThemedBackground with theme.background]   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  [Hero Media - centered, max-h-48]  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│     [Title - ThemedText heading]            │
│                                             │
│     [Description - ThemedText body]         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Experiences coming soon...         │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Rationale**:
- Matches spec diagram exactly
- Uses dashed border placeholder for experiences
- Hero image centered with max-height constraint

---

## Unresolved Items

**None** - All technical decisions have been made based on existing patterns.

---

## Dependencies Verification

| Dependency | Status | Location |
|------------|--------|----------|
| ThemedText | ✅ Verified | `@/shared/theming/components/primitives/ThemedText.tsx` |
| ThemedBackground | ✅ Verified | `@/shared/theming/components/ThemedBackground.tsx` |
| MediaReference | ✅ Verified | `@/shared/theming/schemas/media-reference.schema.ts` |
| EditorSection | ✅ Verified | `@/shared/editor-controls/components/EditorSection.tsx` |
| EditorRow | ✅ Verified | `@/shared/editor-controls/components/EditorRow.tsx` |
| MediaPickerField | ✅ Verified | `@/shared/editor-controls/components/MediaPickerField.tsx` |
| ToggleGroupField | ✅ Verified | `@/shared/editor-controls/components/ToggleGroupField.tsx` |
| PreviewShell | ✅ Verified | `@/shared/preview-shell/` |
| useAutoSave | ✅ Verified | `@/shared/forms/hooks/useAutoSave.ts` |
| useTrackedMutation | ✅ Verified | `@/domains/event/designer/hooks/useTrackedMutation.ts` |
| updateEventConfigField | ✅ Verified | `@/domains/event/shared/lib/updateEventConfigField.ts` |
| useProjectEvent | ✅ Verified | `@/domains/event/shared/hooks/useProjectEvent.ts` |
| useUploadMediaAsset | ✅ Verified | `@/domains/media-library/` |
