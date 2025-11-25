# Quickstart: Experience Editor & AI Playground

**Feature**: 004-exp-editor
**Date**: 2025-11-25

## Prerequisites

1. **PRD 1 Implemented**: Experience routing and basic editor structure exists
2. **AI Provider Configured**: Set `AI_PROVIDER` and relevant API keys in `.env.local`
3. **Firebase Configured**: Firestore and Storage rules in place

## Environment Setup

```bash
# .env.local additions (if not already set)
AI_PROVIDER=google-ai  # or 'n8n' or 'mock'
GOOGLE_AI_API_KEY=your-api-key-here
```

## Quick Test

1. Start dev server: `pnpm dev`
2. Navigate to `/events/{eventId}/design/experiences/{experienceId}`
3. Edit prompt in left panel
4. Upload test image in right panel
5. Click Generate
6. View transformed result

## Key Files to Implement

### New Components

```
web/src/features/experiences/components/
├── AIPlayground.tsx           # Playground panel with upload + generate
└── BrandingContextIndicator.tsx  # Read-only theme display
```

### Modified Components

```
web/src/features/experiences/components/
├── PhotoExperienceEditor.tsx  # Add split-screen layout
└── ExperienceEditorHeader.tsx # Verify enabled toggle + delete
```

### New Server Action

```
web/src/features/experiences/actions/
└── playground-generate.ts     # AI generation for playground
```

## Component Architecture

```
ExperienceEditorPage
└── ExperienceEditor
    └── PhotoExperienceEditor
        ├── ExperienceEditorHeader
        │   ├── Preview Media
        │   ├── Name (editable)
        │   ├── Enabled Switch
        │   └── Delete Button
        │
        ├── ConfigurationPanel (Left)
        │   ├── General Info Section
        │   │   ├── Name Input
        │   │   └── Description Input
        │   ├── AI Engine Section
        │   │   ├── Model Selector
        │   │   ├── Prompt Editor
        │   │   └── BrandingContextIndicator
        │   └── Save Button
        │
        └── AIPlayground (Right)
            ├── Upload Area (drag-drop)
            ├── Generate Button
            ├── Loading State
            └── Result Display
```

## Implementation Order

### Phase 1: Core Layout
1. Create `AIPlayground.tsx` component shell
2. Update `PhotoExperienceEditor.tsx` with split-screen grid
3. Add mobile responsive stacking

### Phase 2: Configuration Panel
1. Add model selector dropdown
2. Verify prompt editor (existing `AITransformSettings`)
3. Create `BrandingContextIndicator.tsx`

### Phase 3: Playground Functionality
1. Implement drag-drop upload in `AIPlayground`
2. Create `playground-generate.ts` Server Action
3. Wire up Generate button with loading state
4. Display transformed result

### Phase 4: Header & Polish
1. Verify enabled toggle works
2. Verify delete with confirmation
3. Add unsaved changes detection
4. Add keyboard shortcut (Cmd+S)

## Testing Checklist

- [ ] Editor loads with existing experience data
- [ ] Model selector populates and saves
- [ ] Prompt editor saves changes
- [ ] Branding context displays event theme
- [ ] File upload accepts JPEG/PNG/WebP
- [ ] File upload rejects invalid types
- [ ] Generate button triggers AI transformation
- [ ] Loading state shows during generation
- [ ] Result displays transformed image
- [ ] Error state shows on generation failure
- [ ] Save button persists all changes
- [ ] Enabled toggle updates experience
- [ ] Delete removes experience with confirmation
- [ ] Mobile layout stacks vertically
- [ ] Touch targets ≥44x44px

## Common Patterns

### Server Action Call

```typescript
const [isPending, startTransition] = useTransition();

const handleSave = () => {
  startTransition(async () => {
    const result = await updatePhotoExperience(experienceId, {
      aiPhotoConfig: { model, prompt },
    });
    if (result.success) {
      toast.success("Saved");
    } else {
      toast.error(result.error.message);
    }
  });
};
```

### File Upload Validation

```typescript
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, or WebP image";
  }
  if (file.size > MAX_SIZE) {
    return "Image must be less than 10MB";
  }
  return null;
}
```

### Responsive Grid

```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div className="space-y-4">
    {/* Configuration Panel */}
  </div>
  <div className="lg:sticky lg:top-4">
    {/* Playground Panel */}
  </div>
</div>
```
