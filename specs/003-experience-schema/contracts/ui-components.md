# UI Components Contract: Experience Schema Migration

**Feature**: 003-experience-schema
**Date**: 2025-11-19
**Version**: 2.0 (Revised based on existing components)

## Overview

This document defines the modifications needed to existing experience builder UI components to support the new discriminated union schema (`config`, `aiConfig`).

**Key Change**: Instead of creating new components, we will modify existing components to read from and write to the new schema structure while maintaining backward compatibility during migration.

## Existing Components (No Changes Needed)

The following components already meet the requirements and need NO modifications:

### ExperienceTypeSelector
**Location**: `web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx`

**Already Implements**:
- Visual card-based type selection (FR-004)
- "Coming Soon" badges for non-photo types (US1-AC2)
- Touch-friendly 44px+ hit areas (MFR-002)
- Mobile-responsive grid layout
- Disabled state for unavailable types

**Status**: ✅ No changes required - already compliant with spec

---

## Components Requiring Schema Updates

### 1. CreateExperienceForm

**Location**: `web/src/features/experiences/components/shared/CreateExperienceForm.tsx`

**Current State**:
- Uses React Hook Form + Zod validation
- Calls `createExperience(eventId, data)` Server Action
- Uses ExperienceTypeSelector for type selection
- Mobile-first responsive (MFR-001, MFR-002, MFR-003 compliant)

**Required Changes**:
None to the component UI - the Server Action (`createExperience`) needs to be updated to write the new schema structure.

**Verification Needed**:
- Ensure `createExperience` action writes new schema: `type: "photo"`, `config: {countdown: 0}`, `aiConfig: {enabled: false, aspectRatio: "1:1"}`
- Validate against updated Zod schema

**Acceptance Criteria**: US1-AC1, US1-AC2, FR-001, FR-002, FR-003

---

### 2. ExperienceEditor

**Location**: `web/src/features/experiences/components/shared/ExperienceEditor.tsx`

**Current State**:
- Reads from flat fields: `experience.countdownEnabled`, `experience.countdownSeconds`, `experience.overlayEnabled`, `experience.aiEnabled`, etc.
- Uses local state for all form fields
- Calls `onSave(experienceId, data)` prop with flat field structure
- Includes AI settings, countdown, overlay frame configuration
- Mobile-responsive with proper touch targets

**Required Changes**:

1. **Update State Initialization** (lines 49-63):
   ```typescript
   // BEFORE (current flat structure)
   const [countdownEnabled, setCountdownEnabled] = useState(experience.countdownEnabled ?? false);
   const [countdownSeconds, setCountdownSeconds] = useState(experience.countdownSeconds ?? 3);
   const [overlayEnabled, setOverlayEnabled] = useState(experience.overlayEnabled ?? false);
   const [overlayFramePath, setOverlayFramePath] = useState(experience.overlayFramePath || "");
   const [aiEnabled, setAiEnabled] = useState(experience.aiEnabled);
   const [aiModel, setAiModel] = useState(experience.aiModel || "nanobanana");
   const [aiPrompt, setAiPrompt] = useState(experience.aiPrompt || "");

   // AFTER (new nested structure with fallback to legacy)
   const [countdownEnabled, setCountdownEnabled] = useState(
     experience.config?.countdown !== undefined ? experience.config.countdown > 0 : experience.countdownEnabled ?? false
   );
   const [countdownSeconds, setCountdownSeconds] = useState(
     experience.config?.countdown ?? experience.countdownSeconds ?? 3
   );
   const [overlayFramePath, setOverlayFramePath] = useState(
     experience.config?.overlayFramePath || experience.overlayFramePath || ""
   );
   const [aiEnabled, setAiEnabled] = useState(
     experience.aiConfig?.enabled ?? experience.aiEnabled ?? false
   );
   const [aiModel, setAiModel] = useState(
     experience.aiConfig?.model || experience.aiModel || "nanobanana"
   );
   const [aiPrompt, setAiPrompt] = useState(
     experience.aiConfig?.prompt || experience.aiPrompt || ""
   );
   const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState<string[]>(
     experience.aiConfig?.referenceImagePaths || experience.aiReferenceImagePaths || []
   );
   const [aiAspectRatio, setAiAspectRatio] = useState<AspectRatio>(
     experience.aiConfig?.aspectRatio || experience.aiAspectRatio || "1:1"
   );
   ```

2. **Update handleSave** (lines 66-90):
   ```typescript
   // BEFORE (writes flat fields)
   await onSave(experience.id, {
     label,
     enabled,
     countdownEnabled,
     countdownSeconds,
     overlayEnabled,
     overlayFramePath: overlayFramePath || undefined,
     aiEnabled,
     aiModel: aiModel || undefined,
     aiPrompt: aiPrompt || undefined,
   });

   // AFTER (writes nested structure)
   await onSave(experience.id, {
     label,
     enabled,
     config: {
       countdown: countdownEnabled ? countdownSeconds : 0,
       overlayFramePath: overlayFramePath || undefined,
     },
     aiConfig: {
       enabled: aiEnabled,
       model: aiModel || undefined,
       prompt: aiPrompt || undefined,
       referenceImagePaths: aiReferenceImagePaths.length > 0 ? aiReferenceImagePaths : undefined,
       aspectRatio: aiAspectRatio,
     },
   });
   ```

**Acceptance Criteria**: FR-006, FR-007, FR-008, US2-AC1, US2-AC2, US2-AC3, US3-AC1, US3-AC2, US3-AC3

---

### 3. ExperienceEditorWrapper

**Location**: `web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx`

**Current State**:
- Wraps ExperienceEditor with Server Actions
- Calls `updateExperienceAction(eventId, experienceId, data)`
- Handles navigation after deletion

**Required Changes**:
None to the component - the Server Action (`updateExperienceAction`) will handle schema migration.

**Verification Needed**:
- Ensure `updateExperienceAction` performs migration logic (FR-008, FR-010)
- Verify it removes deprecated flat fields after migration

**Acceptance Criteria**: FR-008, FR-010

---

## Component Testing Requirements

Each modified component must have tests covering:

### 1. ExperienceEditor Tests

**Location**: `web/src/features/experiences/components/shared/ExperienceEditor.test.tsx`

**Required Test Cases**:

```typescript
describe("ExperienceEditor - Schema Migration", () => {
  it("reads countdown from config.countdown when available", () => {
    const experience = {
      config: { countdown: 5 },
      // Legacy fields should be ignored
      countdownSeconds: 3,
    };

    render(<ExperienceEditor experience={experience} onSave={jest.fn()} />);

    // Should display 5 (from config), not 3 (from legacy)
    expect(screen.getByText("5s")).toBeInTheDocument();
  });

  it("falls back to legacy countdownSeconds if config.countdown is missing", () => {
    const experience = {
      // No config object
      countdownSeconds: 3,
    };

    render(<ExperienceEditor experience={experience} onSave={jest.fn()} />);

    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("writes to nested config structure on save", async () => {
    const onSave = jest.fn();
    const experience = {
      config: { countdown: 3 },
      aiConfig: { enabled: false, aspectRatio: "1:1" },
    };

    render(<ExperienceEditor experience={experience} onSave={onSave} />);

    // Change countdown to 5
    await user.click(screen.getByLabelText(/countdown/i));
    await user.keyboard("{ArrowRight}{ArrowRight}"); // Increment slider

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          config: expect.objectContaining({ countdown: 5 }),
        })
      );
    });
  });

  it("reads AI settings from aiConfig when available", () => {
    const experience = {
      aiConfig: { enabled: true, model: "flux-dev", prompt: "Test prompt" },
      // Legacy fields should be ignored
      aiEnabled: false,
      aiModel: "nanobanana",
    };

    render(<ExperienceEditor experience={experience} onSave={jest.fn()} />);

    // Should use values from aiConfig
    expect(screen.getByDisplayValue("Test prompt")).toBeInTheDocument();
    expect(screen.getByText("Flux Dev")).toBeInTheDocument();
  });

  it("falls back to legacy AI fields if aiConfig is missing", () => {
    const experience = {
      // No aiConfig object
      aiEnabled: true,
      aiPrompt: "Legacy prompt",
    };

    render(<ExperienceEditor experience={experience} onSave={jest.fn()} />);

    expect(screen.getByDisplayValue("Legacy prompt")).toBeInTheDocument();
  });
});
```

### 2. Server Actions Tests

**Required Test Cases**:

```typescript
describe("createExperience - Server Action", () => {
  it("creates experience with new schema structure", async () => {
    const result = await createExperience("event_123", {
      label: "Test Experience",
      type: "photo",
    });

    expect(result.success).toBe(true);

    const doc = await getDoc(doc(db, `events/event_123/experiences/${result.data.id}`));
    const data = doc.data();

    expect(data).toMatchObject({
      type: "photo",
      config: { countdown: 0 },
      aiConfig: { enabled: false, aspectRatio: "1:1" },
    });
  });
});

describe("updateExperienceAction - Server Action", () => {
  it("migrates legacy flat fields to new schema on save", async () => {
    // Create a legacy experience
    const legacyDoc = await addDoc(collection(db, "events/event_123/experiences"), {
      label: "Legacy Experience",
      countdownEnabled: true,
      countdownSeconds: 3,
      aiEnabled: true,
      aiPrompt: "Old prompt",
    });

    // Update via action (triggers migration)
    await updateExperienceAction("event_123", legacyDoc.id, {
      label: "Updated Experience",
    });

    const updated = await getDoc(legacyDoc);
    const data = updated.data();

    // Should have new schema
    expect(data.config).toEqual({ countdown: 3 });
    expect(data.aiConfig).toMatchObject({
      enabled: true,
      prompt: "Old prompt",
      aspectRatio: "1:1",
    });

    // Legacy fields should be removed
    expect(data.countdownEnabled).toBeUndefined();
    expect(data.countdownSeconds).toBeUndefined();
    expect(data.aiEnabled).toBeUndefined();
    expect(data.aiPrompt).toBeUndefined();
  });
});
```

---

## Migration Testing Strategy

### Integration Test Scenarios

1. **Fresh Install Path**: Create new experience → verify new schema
2. **Legacy Migration Path**: Load legacy experience → edit → save → verify migration
3. **Mixed State Path**: Experience with both old and new fields → verify new fields take precedence
4. **Partial Migration Path**: Update one field → verify entire document migrates

### Manual Testing Checklist

- [ ] Create new photo experience → verify Firestore document has `config` and `aiConfig`
- [ ] Load legacy experience in editor → verify UI displays correct values
- [ ] Edit legacy experience → save → verify Firestore document now has new schema
- [ ] Verify countdown: 0 = disabled, >0 = enabled
- [ ] Verify AI settings migrate correctly (enabled, model, prompt, references, aspect ratio)
- [ ] Verify overlay frame path migrates correctly
- [ ] Verify deprecated fields are removed after migration

---

## References

- **Data Model**: [data-model.md](../data-model.md)
- **Server Actions**: [server-actions.md](./server-actions.md)
- **Feature Spec**: [spec.md](../spec.md)
- **Component Standards**: `/standards/frontend/components.md`
- **Accessibility Standards**: `/standards/frontend/accessibility.md`
