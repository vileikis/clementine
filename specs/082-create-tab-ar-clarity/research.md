# Research: Create Tab Aspect Ratio Clarity

**Feature**: `082-create-tab-ar-clarity`
**Date**: 2026-02-24

## R1: Current Create Tab Layout Architecture

**Decision**: Reorganize each outcome config form (AIImageConfigForm, AIVideoConfigForm, PhotoConfigForm) into two labeled sections: "Subject Photo" and "Output".

**Rationale**: Currently, all three forms render SourceImageSelector and AspectRatioSelector in a flat 2-column grid with no section labels. The AR selector label just says "Aspect Ratio" — ambiguous whether it controls capture shape or output shape. The forms are rendered inside `CreateTabForm` which delegates entirely to per-type forms.

**Current layout** (all three forms):
```
[Task Selector (AI types only)]
[SourceImageSelector | AspectRatioSelector]  ← flat grid, no section labels
[PromptComposer (AI types only)]
```

**Target layout**:
```
[Task Selector (AI types only)]
┌─ Subject Photo ──────────────────────┐
│ [Capture step name] [AR: 1:1]        │
└──────────────────────────────────────┘
┌─ Output ─────────────────────────────┐
│ [Output AR: 1:1 / 9:16 / ...]       │
│ [PromptComposer (model, prompt)]     │
└──────────────────────────────────────┘
```

**Alternatives considered**:
- Tabs for input/output sections: Rejected — too heavy for 2 simple sections.
- Keep flat layout with better labels: Rejected — doesn't fix the "hidden source occupying space" issue.

---

## R2: Capture Step AR Access Pattern

**Decision**: Access capture step's AR via `step.config.aspectRatio` after narrowing to `capture.photo` type.

**Rationale**: ExperienceStep is a discriminated union on `type`. When `type === 'capture.photo'`, the `config` field has shape `{ aspectRatio: AspectRatio }`. The capture step ID is stored in the outcome config (`config.captureStepId`), so we look up the step from the `steps` array and read its config.

**Code pattern**:
```typescript
const captureStep = steps.find(s => s.id === config.captureStepId)
if (captureStep?.type === 'capture.photo') {
  const captureAR = captureStep.config.aspectRatio // '1:1' | '3:2' | '2:3' | '9:16'
}
```

**Alternatives considered**:
- Store capture AR redundantly in outcome config: Rejected — violates single source of truth.

---

## R3: Single Capture Step Display Strategy

**Decision**: When only one capture step exists, display it as static text (step name + AR) without a dropdown. When multiple exist, show the existing SourceImageSelector dropdown.

**Rationale**: The current SourceImageSelector always renders as a dropdown regardless of step count. When text-to-image task is selected, the source selector is hidden but its grid slot remains (`<div />` empty slot), causing layout confusion. The new "Subject Photo" section will always be visible, showing the selected step info.

**Key insight**: For AI image `text-to-image` task, `captureStepId` is null and there's no source image. In this case, the "Subject Photo" section should either be hidden entirely or show "None (prompt only)" — matching the existing UX but without the empty grid slot.

**Alternatives considered**:
- Always show dropdown even for 1 step: Rejected — unnecessary interaction for the most common case.
- Completely remove SourceImageSelector: Rejected — still needed when multiple steps exist.

---

## R4: Generation-Level AR in PromptComposer

**Decision**: Keep the generation-level AR field in the schema. Remove the AR control from PromptComposer's ControlRow for the Create tab (stop passing `controls.aspectRatio` to PromptComposer).

**Rationale**: The AI Image PromptComposer currently shows an AR selector inside its ControlRow (via `IMAGE_MODALITY.supports.aspectRatio = true`). This is the generation-level AR override — `imageGeneration.aspectRatio`. Per user decision, the schema field is retained but the UI control should not be exposed. The outcome-level AR in the "Output" section is the single AR control visible to creators.

**Implementation approach**: Stop passing `controls.aspectRatio` and `controls.onAspectRatioChange` to PromptComposer in AIImageConfigForm. The ControlRow already guards on `controls?.aspectRatio !== undefined`, so simply omitting it hides the control. No modality definition changes needed.

**Alternatives considered**:
- Change IMAGE_MODALITY.supports.aspectRatio to false: Would work but is a broader change that might affect other uses.
- Remove field from schema: Rejected by user — kept for future use.

---

## R5: Output Section Organization

**Decision**: The "Output" section contains: Output AR selector (top), then PromptComposer (model, prompt, duration, ref media).

**Rationale**: Matches PRD layout. Output AR is the most important control in this section — placing it at the top makes it immediately visible. PromptComposer already contains model selection, so it naturally groups under "Output".

**For Photo type**: The "Output" section contains only the Output AR selector (no prompt/model). This matches the current behavior where PhotoConfigForm is just SourceImageSelector + AspectRatioSelector.

---

## R6: Files to Modify

| File | Change |
|------|--------|
| `AIImageConfigForm.tsx` | Reorganize into Subject Photo + Output sections. Stop passing AR to PromptComposer controls. |
| `AIVideoConfigForm.tsx` | Reorganize into Subject Photo + Output sections. |
| `PhotoConfigForm.tsx` | Reorganize into Subject Photo + Output sections. |
| `AspectRatioSelector.tsx` | No changes needed (reused as-is in Output section). |
| `SourceImageSelector.tsx` | No changes needed (reused as-is when multiple capture steps). |

**New components** (optional — could be inline):
- `SubjectPhotoSection` — shared wrapper with label + capture step display logic.

**No changes needed**:
- Shared schemas (`packages/shared/`)
- Backend operations (`functions/`)
- PromptComposer internals (ControlRow will auto-hide AR when not passed)
