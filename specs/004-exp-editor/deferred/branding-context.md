# Deferred Feature: Branding Context Indicator

**Deferred From**: 004-exp-editor
**Date**: 2025-11-25
**Reason**: Scope reduction - may be implemented in a future feature

## Original Requirement

From spec.md FR-005:
> System MUST display a read-only branding context indicator showing theme detection from the event

## Planned Implementation

### Component: BrandingContextIndicator.tsx

A read-only panel showing the event's theme settings that would be injected into AI prompts.

**Display Fields**:
- Primary color swatch (from `event.theme.primaryColor`)
- Logo thumbnail (from `event.theme.logoUrl`)
- Font family name (from `event.theme.fontFamily`)
- "No theme configured" message if defaults

### AI Integration

The `brandColor` parameter would be passed to the AI client:

```typescript
// In generatePlaygroundPreview Server Action
const result = await aiClient.generateImage({
  prompt: experience.aiPhotoConfig.prompt,
  inputImageUrl: testImageUrl,
  brandColor: event.theme.primaryColor, // <-- This injection
});
```

### Data Flow

```
Event (fetch) → theme.primaryColor → TransformParams.brandColor → AI Prompt
```

## Why Deferred

- Reduces initial scope for faster delivery
- AI prompt customization may be sufficient without automatic injection
- Can be added later without breaking changes

## Reactivation Checklist

When ready to implement:

1. [ ] Add `BrandingContextIndicator.tsx` component
2. [ ] Update `PhotoExperienceEditor` layout to include indicator
3. [ ] Modify `generatePlaygroundPreview` to fetch event and inject `brandColor`
4. [ ] Update spec.md to restore FR-005
5. [ ] Add acceptance tests for branding context display

## Related Files

- `web/src/features/events/schemas/events.schemas.ts` - EventTheme schema
- `web/src/lib/ai/types.ts` - TransformParams interface (already has `brandColor?`)
