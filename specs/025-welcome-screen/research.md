# Research: Welcome Screen Customization

**Feature**: 025-welcome-screen
**Date**: 2024-12-11

## Overview

This document consolidates research findings for implementing the Welcome Screen Customization feature. All "NEEDS CLARIFICATION" items from the technical context have been resolved through codebase exploration.

---

## 1. Preview Infrastructure

### Decision: Use existing `preview-shell` module

**Rationale**: The preview-shell module provides complete device frame, viewport switching, and fullscreen capabilities that match the requirements exactly.

**Alternatives Considered**:
- Building custom preview component — Rejected: duplicates existing functionality
- Using iframe for isolation — Rejected: unnecessary complexity for this use case

**Key Findings**:

```typescript
// PreviewShell supports all required features
<PreviewShell
  enableViewportSwitcher    // Mobile/desktop toggle
  enableFullscreen          // Fullscreen mode
  defaultViewport="mobile"  // Mobile-first
>
  <ThemedBackground background={theme.background}>
    {/* Welcome screen content */}
  </ThemedBackground>
</PreviewShell>
```

**File Locations**:
- Components: `web/src/features/preview-shell/components/`
- Hooks: `web/src/features/preview-shell/hooks/`
- Types: `web/src/features/preview-shell/types/`

---

## 2. Theming Integration

### Decision: Reuse existing `theming` module with ThemeProvider pattern

**Rationale**: The theming module already provides the exact types and components needed for themed preview rendering.

**Alternatives Considered**:
- Passing theme as props through component tree — Rejected: more verbose, ThemeProvider already handles this
- Creating welcome-specific theme subset — Rejected: unnecessary, full theme applies

**Key Findings**:

```typescript
// Theme types already defined
interface Theme {
  primaryColor: string;
  fontFamily?: string | null;
  text: ThemeText;
  button: ThemeButton;
  background: ThemeBackground;
}

// ThemedBackground handles background rendering with overlay
<ThemedBackground
  background={theme.background}
  fontFamily={theme.fontFamily}
  className="flex h-full flex-col"
>
  {/* Welcome content */}
</ThemedBackground>
```

**File Locations**:
- Types: `web/src/features/theming/types/theme.types.ts`
- Components: `web/src/features/theming/components/`
- Hooks: `web/src/features/theming/hooks/`

---

## 3. Media Upload Handling

### Decision: Use existing `ImageUploadField` component with destination="welcome"

**Rationale**: The media upload infrastructure already supports the "welcome" destination and handles both images and videos.

**Alternatives Considered**:
- Building custom upload component — Rejected: ImageUploadField already handles all requirements
- Using different storage path — Rejected: "welcome" destination already exists and is appropriate

**Key Findings**:

```typescript
// Existing storage destinations include "welcome"
export async function uploadImage(
  file: File,
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference" | "logos" | "backgrounds"
)

// ImageUploadField supports video preview
<ImageUploadField
  id="welcome-media"
  label="Hero Media"
  value={welcome.mediaUrl || ""}
  onChange={handleMediaChange}
  destination="welcome"
  previewType={welcome.mediaType === "video" ? "video" : "image"}
/>
```

**Storage Path**: `images/welcome/{filename}`
**Constraints**: Max 10MB, PNG/JPEG/WebP formats
**Note**: For video support, need to verify if current infrastructure handles video or if extension is needed.

**File Locations**:
- Upload action: `web/src/lib/storage/actions.ts`
- ImageUploadField: `web/src/components/shared/ImageUploadField.tsx`

---

## 4. State Management Pattern

### Decision: Lift form state to EventGeneralTab, use React Hook Form with `useAutoSave` hook

**Rationale**: The WelcomePreview needs both welcome form values AND event.experiences to render the full preview. By lifting form state to EventGeneralTab, both WelcomeSection (form) and WelcomePreview (display) can access the data they need. The existing `useAutoSave` hook requires React Hook Form integration.

**Alternatives Considered**:
- Form state in WelcomeSection only — Rejected: WelcomePreview (sibling component) wouldn't have access to form values
- useReducer + custom autosave — Rejected: useAutoSave hook requires React Hook Form
- Zustand store — Rejected: lifted state sufficient, no global store needed
- React Context for welcome state — Rejected: prop drilling is simpler for this case

**Key Pattern**:

```typescript
// EventGeneralTab.tsx - owns form state
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutoSave } from "@/hooks/useAutoSave";

const form = useForm<EventWelcome>({
  resolver: zodResolver(eventWelcomeSchema),
  defaultValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
});

// Watch form values for preview updates
const welcomeValues = form.watch();

// Autosave integration
const { handleBlur } = useAutoSave({
  form,
  originalValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
  onUpdate: handleSave,
  fieldsToCompare: ['title', 'description', 'mediaUrl', 'mediaType', 'layout'],
  debounceMs: 500,
});

// Two-column layout
<div className="grid lg:grid-cols-[1fr_1fr]">
  <div className="space-y-8">
    <WelcomeSection form={form} event={event} onBlur={handleBlur} />
    <ExperiencesSection event={event} />
    <ExtrasSection event={event} />
  </div>
  <WelcomePreview welcome={welcomeValues} event={event} />
</div>
```

**Benefits**:
- Form state and preview in sync via `watch()`
- WelcomePreview has access to both welcome values AND event.experiences
- Clean separation: WelcomeSection handles form UI, WelcomePreview handles display
- `handleBlur` can be passed down to form components

---

## 5. Autosave Implementation

### Decision: Use existing `useAutoSave` hook with React Hook Form

**Rationale**: The codebase already has a `useAutoSave` hook at `web/src/hooks/useAutoSave.ts` that provides debounced auto-save on blur with change detection. This is the established pattern and should be reused.

**Alternatives Considered**:
- Custom useEffect + setTimeout — Rejected: useAutoSave already handles this with better change detection
- lodash debounce — Rejected: useAutoSave provides cleaner integration
- Manual save button — Rejected: spec requires autosave

**Existing Hook** (`web/src/hooks/useAutoSave.ts`):

```typescript
interface UseAutoSaveOptions<TFormValues extends FieldValues, TOriginal> {
  form: UseFormReturn<TFormValues>;      // React Hook Form instance
  originalValues: TOriginal;              // Original data to compare against
  onUpdate: (updates: Partial<TFormValues>) => Promise<void>;
  fieldsToCompare: (keyof TFormValues)[]; // Fields to check for changes
  debounceMs?: number;                    // Default: 300ms
}

// Returns { handleBlur } to attach to form
const { handleBlur } = useAutoSave({
  form,
  originalValues: event.welcome,
  onUpdate: async (updates) => {
    await updateEventWelcomeAction(projectId, eventId, updates);
  },
  fieldsToCompare: ['title', 'description', 'mediaUrl', 'mediaType', 'layout'],
  debounceMs: 500,
});
```

**Key Features**:
- Triggers on blur (not every keystroke)
- Debounced with configurable delay (use 500ms per spec)
- Detects only changed fields via `getChangedFields` utility
- Validates form before saving
- Cleanup on unmount

**Integration Pattern**:

```tsx
// Use with React Hook Form
const form = useForm<EventWelcome>({
  defaultValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
});

const { handleBlur } = useAutoSave({
  form,
  originalValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
  onUpdate: async (updates) => {
    const result = await updateEventWelcomeAction(projectId, eventId, updates);
    if (result.success) {
      toast.success("Saved");
    } else {
      toast.error(result.error.message);
    }
  },
  fieldsToCompare: ['title', 'description', 'mediaUrl', 'mediaType', 'layout'],
  debounceMs: 500,
});

return (
  <form onBlur={handleBlur}>
    {/* Form fields */}
  </form>
);
```

**File Location**: `web/src/hooks/useAutoSave.ts`
**Dependencies**: React Hook Form, `@/lib/utils/form-diff`

---

## 6. Event Data Model Extension

### Decision: Add `welcome: EventWelcome` field to Event interface

**Rationale**: The spec clearly defines the welcome field as a nested object within Event, following the existing pattern for theme and extras.

**Alternatives Considered**:
- Separate collection for welcome configs — Rejected: unnecessary, welcome is 1:1 with event
- Flat fields on Event — Rejected: welcome fields are logically grouped

**Schema Definition**:

```typescript
// New types
export type ExperienceLayout = "list" | "grid";

export interface EventWelcome {
  title?: string | null;        // Max 100 chars
  description?: string | null;  // Max 500 chars
  mediaUrl?: string | null;     // Full public URL
  mediaType?: "image" | "video" | null;
  layout: ExperienceLayout;     // Default: "list"
}

// Updated Event interface
export interface Event {
  // ... existing fields
  welcome: EventWelcome;  // NEW
}

// Default value for new events
const DEFAULT_WELCOME: EventWelcome = {
  title: null,
  description: null,
  mediaUrl: null,
  mediaType: null,
  layout: "list",
};
```

---

## 7. Firestore Update Strategy

### Decision: Use dot notation for partial updates (matching existing theme pattern)

**Rationale**: Firestore supports dot notation for updating nested fields without overwriting the entire object. This is already used for theme updates.

**Alternatives Considered**:
- Full object replacement — Rejected: risk of data loss, more bandwidth
- Separate document for welcome — Rejected: unnecessary complexity

**Repository Pattern**:

```typescript
export async function updateEventWelcome(
  projectId: string,
  eventId: string,
  welcome: Partial<EventWelcome>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Build dot-notation updates for nested fields
  Object.entries(welcome).forEach(([key, value]) => {
    updateData[`welcome.${key}`] = value;
  });

  await updateDoc(eventRef, updateData);
}
```

---

## 8. Experience Card Display

### Decision: Create simple card components for list/grid layouts

**Rationale**: Experience cards need to display experience name (or custom label) in either list or grid format. Simple components are sufficient.

**Alternatives Considered**:
- Reusing existing experience cards from elsewhere — Rejected: no suitable reusable card exists for this context
- Complex card with thumbnails — Rejected: out of scope per spec

**Component Approach**:

```typescript
// ExperienceCard for welcome preview
interface ExperienceCardProps {
  experienceLink: EventExperienceLink;
  experienceName: string;  // Resolved from experiences collection
}

// Layout container
interface ExperienceLayoutProps {
  experiences: EventExperienceLink[];
  layout: ExperienceLayout;
  onSelectExperience?: (id: string) => void;
}

// Render based on layout
{layout === "list" ? (
  <div className="flex flex-col gap-3">
    {experiences.map(exp => <ExperienceCard key={exp.experienceId} ... />)}
  </div>
) : (
  <div className="grid grid-cols-2 gap-3">
    {experiences.map(exp => <ExperienceCard key={exp.experienceId} ... />)}
  </div>
)}
```

---

## 9. General Tab Layout

### Decision: Two-column layout with preview at EventGeneralTab level

**Rationale**: The WelcomePreview needs to display both welcome content AND experience cards from the event. By placing the preview at the tab level (not inside WelcomeSection), it can access all the data it needs. This also allows the preview to remain visible while scrolling through all sections.

**Layout Structure**:

```
┌─────────────────────────────────────────────────┐
│ EventGeneralTab (two-column on lg:)             │
├────────────────────────┬────────────────────────┤
│ Left Panel (sections)  │ Right Panel (preview)  │
│ ┌────────────────────┐ │ ┌────────────────────┐ │
│ │ WelcomeSection     │ │ │ WelcomePreview     │ │
│ │ (form fields)      │ │ │ (sticky)           │ │
│ └────────────────────┘ │ │ - Hero media       │ │
│ ┌────────────────────┐ │ │ - Title            │ │
│ │ ExperiencesSection │ │ │ - Description      │ │
│ └────────────────────┘ │ │ - Experience cards │ │
│ ┌────────────────────┐ │ │                    │ │
│ │ ExtrasSection      │ │ └────────────────────┘ │
│ └────────────────────┘ │                        │
└────────────────────────┴────────────────────────┘
```

**Section Order** (left panel):
1. **WelcomeSection** (NEW) — Title, description, media, layout fields
2. **ExperiencesSection** (existing) — Linked experiences
3. **ExtrasSection** (existing) — Pre-entry gate, pre-reward

**Layout Pattern**:

```typescript
// EventGeneralTab.tsx
export function EventGeneralTab({ event, projectId }: Props) {
  // Form state lifted to tab level
  const form = useForm<EventWelcome>({
    resolver: zodResolver(eventWelcomeSchema),
    defaultValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
  });
  const welcomeValues = form.watch();

  const { handleBlur } = useAutoSave({
    form,
    originalValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
    onUpdate: async (updates) => {
      await updateEventWelcomeAction(projectId, event.id, updates);
    },
    fieldsToCompare: ['title', 'description', 'mediaUrl', 'mediaType', 'layout'],
    debounceMs: 500,
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
      {/* Left: Form sections */}
      <div className="space-y-8">
        <WelcomeSection form={form} event={event} onBlur={handleBlur} />
        <ExperiencesSection event={event} />
        <ExtrasSection event={event} />
      </div>

      {/* Right: Preview (sticky) */}
      <div className="lg:sticky lg:top-4">
        <WelcomePreview welcome={welcomeValues} event={event} />
      </div>
    </div>
  );
}
```

**Component Locations**:
- `components/welcome/WelcomeSection.tsx` — Form fields only (receives form prop)
- `components/welcome/WelcomePreview.tsx` — Preview rendering (receives welcome + event)
- `components/welcome/ExperienceCards.tsx` — Card list/grid helper for preview
- `components/general/ExperiencesSection.tsx` — Existing
- `components/general/ExtrasSection.tsx` — Existing

---

## 10. Video Support Clarification

### Decision: Support video uploads through existing infrastructure with minor extension

**Finding**: The current `ImageUploadField` component supports `previewType="video"` for display, but the upload action only accepts image MIME types (PNG, JPEG, WebP).

**Required Extension**:
1. Add video MIME types to upload validation (MP4, WebM)
2. Increase file size limit for videos (50MB for images, 200MB for videos per spec)
3. Auto-detect media type based on uploaded file MIME type

**Implementation Approach**:
- Create `MediaUploadField` variant or extend `ImageUploadField` to accept video
- Update upload action to handle video MIME types
- Use MIME type to set `welcome.mediaType` automatically

---

## Summary

All technical decisions align with existing codebase patterns:

| Aspect | Decision | Existing Pattern Followed |
|--------|----------|---------------------------|
| Preview | preview-shell module | EventThemeEditor |
| Theming | theming module | EventThemeEditor |
| Upload | ImageUploadField (extended) | Theme background upload |
| State | React Hook Form + lifted state | EventGeneralTab owns form state |
| Autosave | useAutoSave hook (500ms) | `web/src/hooks/useAutoSave.ts` |
| Data Model | Nested EventWelcome | Event.theme pattern |
| Updates | Dot notation | updateEventTheme |
| Tab Layout | Two-column (sections + preview) | EventThemeEditor |
| Components | `components/welcome/` subfolder | Domain-specific grouping |

No new architectural patterns or dependencies required. Reuses existing `useAutoSave` hook for autosave functionality. Form state lifted to EventGeneralTab to enable preview access to both welcome values and event.experiences.
