# Research: Event Outro & Share Configuration

**Feature**: 028-outro-screen
**Date**: 2025-12-15
**Purpose**: Resolve technical unknowns and document patterns to follow

## Research Summary

This feature follows well-established patterns from the Welcome screen configuration. No significant unknowns require resolution - the implementation approach is clear based on existing codebase patterns.

---

## 1. Event Model Extension Pattern

### Decision
Extend the Event interface with two new optional fields: `outro` (EventOutro) and `shareOptions` (EventShareOptions), following the same pattern as `welcome` (EventWelcome).

### Rationale
- EventWelcome already demonstrates the pattern for optional event-level configuration
- Fields stored directly on Event document (no subcollection needed)
- Default values provided when fields are undefined

### Existing Pattern (EventWelcome)
```typescript
// From web/src/features/events/types/event.types.ts
interface Event {
  // ... other fields
  welcome?: EventWelcome;  // Optional with defaults
}

interface EventWelcome {
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  layout: ExperienceLayout;
}

// From web/src/features/events/constants.ts
const DEFAULT_EVENT_WELCOME: EventWelcome = {
  title: "Choose your experience",
  description: null,
  mediaUrl: null,
  mediaType: null,
  layout: "list",
};
```

### Alternatives Considered
- **Separate Firestore collection**: Rejected - unnecessary complexity for event-scoped config
- **Nested in welcome field**: Rejected - outro is conceptually separate from welcome

---

## 2. Admin Configuration UI Pattern

### Decision
Create a dedicated `/outro/` route under the event, using the two-column layout pattern (form + preview) from EventGeneralTab.

### Rationale
- EventGeneralTab provides proven UX for form + preview configuration
- Two-column layout works well for real-time preview feedback
- Autosave pattern (useAutoSave) provides good UX without explicit save buttons

### Existing Pattern (EventGeneralTab)
```typescript
// Two-column layout with sticky preview
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  {/* Left column: Form */}
  <div className="space-y-6" onBlur={handleBlur}>
    <WelcomeSection form={form} event={event} />
  </div>

  {/* Right column: Preview (sticky on desktop) */}
  <div className="lg:sticky lg:top-4 lg:self-start">
    <WelcomePreview event={event} welcomeValues={watchedValues} />
  </div>
</div>

// Form with real-time watch
const form = useForm<EventWelcome>({
  resolver: zodResolver(eventWelcomeSchema),
  defaultValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
});

const watchedValues = useWatch({ control: form.control });
```

### Alternatives Considered
- **Tab within existing page**: Rejected - PRD specifies separate page
- **Modal dialog**: Rejected - doesn't support preview well

---

## 3. Autosave Implementation

### Decision
Use existing `useAutoSave` hook with `handleBlur` pattern, same as Welcome configuration.

### Rationale
- Pattern already proven in WelcomeSection
- Debounced saves (500ms) prevent excessive writes
- Only saves changed fields via `getChangedFields` utility

### Existing Pattern
```typescript
// From web/src/hooks/useAutoSave.ts
const { handleBlur } = useAutoSave({
  form,
  originalValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
  onUpdate: handleSave,
  fieldsToCompare: ["title", "description", "mediaUrl", "mediaType", "layout"],
  debounceMs: 500,
});

// Attach to form container
<div className="space-y-4" onBlur={handleBlur}>
```

---

## 4. Preview Component Pattern

### Decision
Create OutroPreview component using PreviewShell + ThemeProvider + ThemedBackground, following WelcomePreview pattern.

### Rationale
- PreviewShell provides device frame and viewport switching
- ThemeProvider enables useEventTheme hook for themed styling
- ThemedBackground applies background colors/images with overlay

### Existing Pattern (WelcomePreview)
```typescript
<PreviewShell enableViewportSwitcher enableFullscreen>
  <ThemeProvider theme={event.theme}>
    <ThemedBackground background={theme.background} fontFamily={theme.fontFamily}>
      {/* Preview content */}
    </ThemedBackground>
  </ThemeProvider>
</PreviewShell>
```

---

## 5. Share Options Data Model

### Decision
Use `ShareSocial` type from steps module for social platform enum. Create `EventShareOptions` with boolean toggles for download/share/email plus socials array.

### Rationale
- ShareSocial already defines platform options: `"instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp"`
- RewardStep.config provides proven pattern for share option structure
- Reusing existing types maintains consistency

### Existing Pattern (StepReward)
```typescript
// From web/src/features/steps/types/step.types.ts
interface StepReward extends StepBase {
  type: "reward";
  config: {
    allowDownload: boolean;
    allowSystemShare: boolean;
    allowEmail: boolean;
    socials: ShareSocial[];
  };
}

type ShareSocial = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp";
```

### Alternatives Considered
- **New social platform type**: Rejected - ShareSocial already covers all needed platforms
- **Object map instead of array**: Rejected - array is simpler and existing pattern

---

## 6. Server Action Pattern

### Decision
Create `updateEventOutroAction` server action following `updateEventWelcomeAction` pattern.

### Rationale
- Admin SDK for write operations (Constitution Principle VI)
- Dot-notation updates for partial field updates
- Zod validation at server boundary

### Existing Pattern
```typescript
// Server action pattern (updateEventWelcomeAction)
export async function updateEventWelcomeAction(
  eventId: string,
  projectId: string,
  welcome: Partial<EventWelcome>
): Promise<ActionResult<void>> {
  const parsed = partialEventWelcomeSchema.safeParse(welcome);
  if (!parsed.success) {
    return { success: false, error: "Invalid welcome data" };
  }

  await eventsRepository.updateEventWelcome(eventId, projectId, parsed.data);
  return { success: true, data: undefined };
}

// Repository method with dot-notation updates
async updateEventWelcome(eventId: string, projectId: string, welcome: Partial<EventWelcome>) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(welcome)) {
    updates[`welcome.${key}`] = value;
  }
  updates["updatedAt"] = Date.now();

  await this.eventsCollection(projectId).doc(eventId).update(updates);
}
```

---

## 7. Guest-Facing Component Pattern

### Decision
Create OutroContent component in `features/guest/components/outro/` following WelcomeContent pattern.

### Rationale
- Guest module separates guest-facing concerns from admin
- Component receives config + theme, renders without admin dependencies
- Can be used in both guest flow and admin preview

### Existing Pattern (WelcomeContent)
```typescript
// Guest-facing component structure
interface WelcomeContentProps {
  event: Event;
  experiences: Map<string, Experience>;
  onExperienceClick?: (experienceId: string) => void;
}

export function WelcomeContent({ event, experiences, onExperienceClick }: WelcomeContentProps) {
  const { theme, buttonBgColor, buttonTextColor } = useEventTheme();
  const welcome = event.welcome ?? DEFAULT_EVENT_WELCOME;

  return (
    <ThemedBackground background={theme.background}>
      {/* Welcome content */}
    </ThemedBackground>
  );
}
```

---

## Key Implementation Notes

1. **Form State Lifting**: Outro form state lifted to page level, passed to both form sections and preview
2. **Real-time Preview**: Use `useWatch` to get form values for preview without saves
3. **Autosave on Blur**: Attach `handleBlur` to form container, not individual fields
4. **Placeholder Image**: Preview uses static placeholder, not real generated asset
5. **Responsive Layout**: Mobile-first with stacked layout, side-by-side on lg breakpoint
6. **Share Section Visibility**: When all share options disabled, hide share section entirely

## Files to Reference

| Pattern | Reference File |
|---------|----------------|
| Event types | `web/src/features/events/types/event.types.ts` |
| Event schemas | `web/src/features/events/schemas/event.schemas.ts` |
| Welcome form | `web/src/features/events/components/welcome/WelcomeSection.tsx` |
| Welcome preview | `web/src/features/events/components/welcome/WelcomePreview.tsx` |
| Event General Tab | `web/src/features/events/components/EventGeneralTab.tsx` |
| Autosave hook | `web/src/hooks/useAutoSave.ts` |
| Preview shell | `web/src/features/preview-shell/components/PreviewShell.tsx` |
| Theming | `web/src/features/theming/` |
| Share types | `web/src/features/steps/types/step.types.ts` (ShareSocial) |
| Reward step | `web/src/features/experience-engine/components/steps/RewardStep.tsx` |
