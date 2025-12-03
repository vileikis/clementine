# Quickstart: Experience Editor Tabs (Design & Settings)

**Feature Branch**: `001-exp-settings-routes`
**Date**: 2025-12-03

---

## Overview

This document provides a quick reference for implementing the Experience Editor tabs feature. Use this as a checklist during development.

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `web/src/app/(workspace)/[companySlug]/exps/[expId]/layout.tsx` | Shared layout with header and tabs |
| `web/src/app/(workspace)/[companySlug]/exps/[expId]/design/page.tsx` | Design route (existing editor) |
| `web/src/app/(workspace)/[companySlug]/exps/[expId]/settings/page.tsx` | Settings route (new form) |
| `web/src/features/experiences/components/settings/ExperienceSettingsForm.tsx` | Settings form component |
| `web/src/features/experiences/components/settings/index.ts` | Barrel export |

### Files to Modify

| File | Change |
|------|--------|
| `web/src/features/experiences/types/experiences.types.ts` | Add `previewMediaUrl`, `previewType` fields |
| `web/src/features/experiences/schemas/experiences.schemas.ts` | Add settings validation schema |
| `web/src/features/experiences/actions/experiences.ts` | Add `updateExperienceSettingsAction` |
| `web/src/features/experiences/constants.ts` | Add preview media constraints |
| `web/src/features/experiences/components/ExperienceCard.tsx` | Add preview thumbnail |
| `web/src/features/experiences/components/index.ts` | Export new settings components |
| `web/src/app/(workspace)/[companySlug]/exps/[expId]/page.tsx` | Redirect to /design |

### Files to Move/Rename

| From | To |
|------|-----|
| `[expId]/page.tsx` (current content) | `[expId]/design/page.tsx` |
| `[expId]/ExperienceEditorClient.tsx` | Keep in place or move to design/ |

---

## Implementation Order

### Phase 1: Route Structure (P1 - Design Tab)

1. Create `[expId]/layout.tsx` with shared header
2. Create `[expId]/design/page.tsx` with existing editor content
3. Update `[expId]/page.tsx` to redirect to `/design`
4. Verify all existing functionality works

### Phase 2: Settings Infrastructure (P2 - Settings Tab)

5. Add preview fields to Experience type
6. Add settings schema
7. Create `updateExperienceSettingsAction`
8. Create `[expId]/settings/page.tsx`
9. Create `ExperienceSettingsForm` component

### Phase 3: Preview Media (P2/P3)

10. Add upload action or reuse existing
11. Add media upload to settings form
12. Update `ExperienceCard` with thumbnail

---

## Key Patterns Reference

### Server Action Pattern

```typescript
"use server";

export async function updateExperienceSettingsAction(
  experienceId: string,
  input: UpdateExperienceSettingsInput
): Promise<ActionResponse<void>> {
  // 1. Auth
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: { code: "PERMISSION_DENIED", message: auth.error } };
  }

  try {
    // 2. Validate
    const validated = updateExperienceSettingsInputSchema.parse(input);

    // 3. Verify existence
    const experience = await getExperience(experienceId);
    if (!experience) {
      return { success: false, error: { code: "EXPERIENCE_NOT_FOUND", message: "Experience not found" } };
    }

    // 4. Update
    await updateExperience(experienceId, validated);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: error.errors[0].message } };
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update experience" } };
  }
}
```

### Form with useReducer Pattern

```typescript
"use client";

type SettingsState = {
  name: string;
  description: string | null;
  previewMediaUrl: string | null;
  previewType: "image" | "gif" | null;
  isDirty: boolean;
};

type SettingsAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string | null }
  | { type: "SET_PREVIEW"; payload: { url: string; type: "image" | "gif" } }
  | { type: "CLEAR_PREVIEW" }
  | { type: "RESET"; payload: SettingsState };

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload, isDirty: true };
    // ... other cases
  }
}

export function ExperienceSettingsForm({ experience }: Props) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateExperienceSettingsAction(experience.id, state);
      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.error.message);
      }
    });
  };

  return (/* form UI */);
}
```

### Layout with Redirect

```typescript
// [expId]/page.tsx
import { redirect } from "next/navigation";

export default async function ExperienceIndexPage({
  params,
}: {
  params: Promise<{ companySlug: string; expId: string }>;
}) {
  const { companySlug, expId } = await params;
  redirect(`/${companySlug}/exps/${expId}/design`);
}
```

---

## Validation Checklist

Before marking complete:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (if tests added)
- [ ] Navigation between Design/Settings tabs works
- [ ] Settings form saves correctly
- [ ] Preview media upload works
- [ ] ExperienceCard shows thumbnails
- [ ] Redirect from base URL to /design works
- [ ] Mobile layout is functional (320px viewport)

---

## Testing Scenarios

### Manual Testing

1. Navigate to `/company/exps/exp123` → should redirect to `/design`
2. Click Settings tab → should show settings form
3. Update name → save → verify toast and real-time update
4. Upload preview image → verify upload and display
5. View experience list → verify thumbnail appears on card
6. Test on mobile viewport (Chrome DevTools)

### Edge Cases

1. Empty name → should show validation error
2. Large file upload → should show size error
3. Invalid file type → should show type error
4. Network error during save → should show error toast

---

## Reference Files

- Tabs: `web/src/features/experiences/components/editor/ExperienceTabs.tsx`
- Media Upload: `web/src/features/steps/components/shared/StepMediaUpload.tsx`
- Theme Editor (pattern): `web/src/features/projects/components/designer/ThemeEditor.tsx`
- Event Layout (pattern): `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/layout.tsx`
