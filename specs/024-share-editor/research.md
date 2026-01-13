# Research: Share Screen Editor

**Feature**: 024-share-editor
**Date**: 2026-01-13

## Research Questions

### 1. Schema Design: Where should share screen config live?

**Decision**: Add new `share` field to `projectEventConfigSchema` alongside existing `sharing` field

**Rationale**:
- The spec explicitly requires (FR-016): "System MUST update the event config schema to include a `share` field containing title, description, and cta properties"
- The existing `sharing` field contains boolean toggles for share options (download, copyLink, social platforms)
- Separating `share` (presentation/content) from `sharing` (which platforms are enabled) provides clear domain separation
- The spec also requires (FR-017): "System MUST rename the existing `sharing` field to `shareOptions`" - however, this is a breaking change that should be evaluated separately. For this feature, we'll add the new `share` field without renaming `sharing`.

**Alternatives Considered**:
1. ~~Nest under existing `sharing` field~~ - Rejected: Conflates platform toggles with content configuration
2. ~~Create separate Firestore document~~ - Rejected: Over-engineering, config is small and fits in existing pattern
3. ~~Rename `sharing` to `shareOptions` immediately~~ - Deferred: Breaking change requires migration strategy

### 2. Preview Component: Two-zone layout implementation

**Decision**: Implement fixed footer + scrollable content using CSS flexbox with `flex-col` and `overflow-y-auto`

**Rationale**:
- Spec (FR-013) requires: "System MUST display the preview with two zones: scrollable content (title, description, media) and fixed footer (share icons, buttons)"
- This is a standard mobile pattern used in real share screens
- CSS-only solution (no JS positioning) is more maintainable

**Implementation Pattern**:
```tsx
<div className="flex flex-col h-full">
  {/* Scrollable content zone */}
  <div className="flex-1 overflow-y-auto">
    {/* Title, description, placeholder media */}
  </div>

  {/* Fixed footer zone */}
  <div className="shrink-0 border-t">
    {/* Share icons, Start over button, CTA button */}
  </div>
</div>
```

**Alternatives Considered**:
1. ~~`position: fixed` footer~~ - Rejected: Requires manual height calculations, complicates preview shell integration
2. ~~JavaScript scroll-based visibility~~ - Rejected: Over-engineering for preview component

### 3. CTA Validation: When to validate URL

**Decision**: Client-side validation on blur + form submission validation

**Rationale**:
- Spec (AC-4 in User Story 3): "Given an admin enters a CTA label without a URL, When they attempt to save, Then they are prompted to provide a URL"
- Spec (AC-5 in User Story 3): "Given an admin enters an invalid URL format, When the URL field loses focus, Then a validation error is displayed"
- react-hook-form + Zod provides this out of the box

**Implementation Pattern**:
```tsx
// Conditional validation: URL required only when label is provided
const shareSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  cta: z.object({
    label: z.string().nullable(),
    url: z.string().url().nullable(),
  }).refine(
    (data) => !data.label || data.url, // If label exists, URL must exist
    { message: 'URL is required when CTA label is provided', path: ['url'] }
  ),
})
```

### 4. Share Options: Location of toggle controls

**Decision**: Share options (platform toggles) editable in BOTH Share tab AND Settings tab

**Rationale**:
- Spec (FR-007) requires share option toggles with live preview
- The Share tab provides the best UX for configuring share options with immediate visual feedback
- Settings tab keeps existing toggle UI for users who prefer that workflow
- Both locations write to the same `shareOptions` field using the shared `useUpdateShareOptions` hook
- The preview in Share tab shows the configured share icons in real-time

**Implementation**:
- Rename existing `sharing` field to `shareOptions` (FR-017)
- Create new shared component `SelectOptionCard` optimized for narrow ConfigPanel sidebars
- Reuse `useUpdateShareOptions` hook in ShareEditorPage
- Update `SharingSection` in Settings to use `shareOptions` field
- No data migration needed - handle missing field with defaults

**Alternatives Considered**:
1. ~~Keep toggles only in Settings~~ - Rejected: Misses opportunity for better UX with live preview
2. ~~Remove toggles from Settings~~ - Rejected: Breaking change for existing users
3. ~~Create separate hook for Share tab~~ - Rejected: Unnecessary duplication, reuse existing hook

### 5. Default Values: Handling existing events

**Decision**: Use Zod `.default()` and schema defaults for backward compatibility

**Rationale**:
- Spec (FR-018): "System MUST handle defaults for existing events that lack the new share configuration fields"
- Existing pattern in codebase: `event?.draftConfig?.share ?? DEFAULT_SHARE`
- Zod schema defaults provide consistent fallback values

**Default Values**:
```typescript
export const DEFAULT_SHARE: ShareConfig = {
  title: null,      // No title by default (hidden when null)
  description: null, // No description by default (hidden when null)
  cta: {
    label: null,    // No CTA by default (button hidden when label is null)
    url: null,
  },
}
```

### 6. Preview Media Placeholder

**Decision**: Use a static placeholder image for the result media area in edit mode

**Rationale**:
- Spec (FR-012): "System MUST show a placeholder image in the preview for the result media area"
- No actual AI-generated result exists during editing
- A placeholder helps admins visualize the layout proportions

**Implementation**:
- Use a simple gray gradient or Clementine-branded placeholder
- Same aspect ratio as typical result images (1:1 or 9:16)
- Can use Lucide icon (`Image` or `ImageOff`) as fallback

## Best Practices Applied

### Tab Navigation Pattern
Following existing Welcome/Theme tab patterns:
- TanStack Router with `$eventId.share.tsx` route file
- Add tab to `eventDesignerTabs` array in `EventDesignerLayout.tsx`
- Same URL structure: `/workspace/$workspaceSlug/projects/$projectId/events/$eventId/share`

### Auto-Save Pattern
Following existing auto-save patterns:
- `useAutoSave` hook with 2000ms debounce
- `useTrackedMutation` for save state tracking
- No explicit "Save" button - changes auto-save

### Form State Pattern
Following existing form patterns:
- `react-hook-form` with `useForm` and `useWatch`
- `values` prop to sync with server data
- `handleUpdate` callback pattern for control updates

### Preview Pattern
Following existing preview patterns:
- `PreviewShell` with viewport switcher and fullscreen
- `ThemeProvider` wrapper for theme-aware styling
- Live updates via `useWatch` from form control

## Integration Points

| Component | Integration | Notes |
|-----------|-------------|-------|
| `EventDesignerLayout` | Add "Share" tab to `eventDesignerTabs` | Insert between Theme and Settings |
| `projectEventConfigSchema` | Add `share` schema, rename `sharing` → `shareOptions` | Schema update, no data migration |
| `updateEventConfigField` | Use existing helper | Dot-notation: `share.title`, `shareOptions.download` |
| `useUpdateShareOptions` | Reuse in ShareEditorPage | Update field prefix from `sharing` to `shareOptions` |
| `SharingSection` | Update to read from `shareOptions` | Minor field name change |
| `SelectOptionCard` | New shared component | Compact toggle card for ConfigPanel sidebars |
| `PreviewShell` | Use existing component | No modifications needed |
| `ThemeProvider` | Use existing component | Applies event theme to preview |
| Route file | Create `$eventId.share.tsx` | Follow existing route pattern |

## Schema Extension

Updated schema structure:
```typescript
projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number(),
  theme: themeSchema.nullable(),
  overlays: overlaysConfigSchema,
  shareOptions: shareOptionsConfigSchema.nullable(),  // Platform toggles (RENAMED from 'sharing')
  welcome: welcomeConfigSchema.nullable(),
  share: shareConfigSchema.nullable(),                // Content/presentation config (NEW)
})
```

New `shareConfigSchema`:
```typescript
export const ctaConfigSchema = z.object({
  label: z.string().nullable().default(null),
  url: z.string().url().nullable().default(null),
})

export const shareConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})
```
