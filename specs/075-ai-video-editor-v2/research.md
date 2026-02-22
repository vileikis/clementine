# Research: AI Video Editor v2

**Branch**: `075-ai-video-editor-v2` | **Date**: 2026-02-22

## R-001: PromptComposer Model Options

**Context**: PromptComposer currently hardcodes `AI_IMAGE_MODELS` internally. Video generation needs `AI_VIDEO_MODELS` instead.

**Decision**: Add a `modelOptions` prop to PromptComposer, passed through to ControlRow (which already accepts `modelOptions`). Default to `AI_IMAGE_MODELS` for backward compatibility.

**Rationale**: ControlRow already supports configurable model options via props. The gap is only in PromptComposer, which imports `AI_IMAGE_MODELS` directly. Adding the prop is a single-line change with no breaking impact.

**Alternatives considered**:
- Create a separate VideoPromptComposer component — rejected, duplicates 95% of logic
- Use context to inject model options — over-engineered for this use case

## R-002: Duration Picker Integration

**Context**: PromptComposer has no duration control. VideoGenerationSection has a freeform number input (1-60). Need fixed options (4/6/8s) inside the PromptComposer control row.

**Decision**: Add optional duration props to ControlRow (`duration`, `onDurationChange`, `durationOptions`) and pass through from PromptComposer. When not provided, duration picker is hidden. Render as a Select dropdown consistent with model/aspect ratio pickers.

**Rationale**: ControlRow is a flex row with model, aspect ratio, and add-media button. A third select fits naturally. Using optional props keeps ControlRow backward-compatible for AI Image usage.

**Alternatives considered**:
- Render duration picker outside PromptComposer as adjacent control — rejected, breaks visual grouping within the bordered container
- Use segmented control (radio group) — viable but inconsistent with existing Select pattern in ControlRow

## R-003: Reference Media Visibility Control

**Context**: PromptComposer always shows reference media strip and add button. For `image-to-video`, ref media should be hidden entirely.

**Decision**: Add a `hideRefMedia` boolean prop to PromptComposer (default: `false`). When true, hide ReferenceMediaStrip and the AddMediaButton in ControlRow. This mirrors the existing `hideAspectRatio` pattern.

**Rationale**: Consistent with existing patterns. The `hideAspectRatio` prop already demonstrates this approach.

**Alternatives considered**:
- Pass empty refMedia array and disable add button — doesn't hide the strip, confusing UX
- Conditional rendering in parent — PromptComposer owns the bordered container, so hiding internally is cleaner

## R-004: useRefMediaUpload Max Count

**Context**: `useRefMediaUpload` uses hardcoded `MAX_REF_MEDIA_COUNT = 5`. Video Remix needs max 2.

**Decision**: Add an optional `maxCount` parameter to `useRefMediaUpload` (default: `MAX_REF_MEDIA_COUNT` = 5). The hook computes `canAddMore` and `availableSlots` using this param.

**Rationale**: Minimal change, backward-compatible default, single point of control.

**Alternatives considered**:
- Create separate `MAX_VIDEO_REF_MEDIA_COUNT` constant and have the parent compute `canAddMore` — works but duplicates the slot logic that the hook already encapsulates

## R-005: Legacy Task Migration Strategy

**Context**: Existing `ai.video` outcomes have `task: 'animate'`. Need migration to `task: 'image-to-video'`.

**Decision**: Use Zod `.transform()` on the task field for lazy migration. When Zod parses `'animate'`, it transforms to `'image-to-video'`. This is the approach recommended in the requirements document.

**Rationale**: AI Video is a new feature with minimal production data. Lazy migration avoids a separate migration script. The transform runs at parse time on both frontend and backend.

**Implementation**:
```typescript
// Pre-transform with .pipe():
const rawTaskSchema = z.enum(['animate', 'image-to-video', 'ref-images-to-video', 'transform', 'reimagine'])
const aiVideoTaskSchema = rawTaskSchema.transform(v => v === 'animate' ? 'image-to-video' : v)
```

**Alternatives considered**:
- Firestore migration script — over-engineered for minimal data
- Parse-time check in frontend only — backend also needs the transform for job snapshots

## R-006: Legacy Duration Migration

**Context**: Existing configs may have `duration: 5` (no longer valid with fixed 4/6/8 values).

**Decision**: Use Zod `.transform()` to coerce invalid durations to nearest valid value: `4 → 4`, `5 → 6`, `6 → 6`, `7 → 8`, `8 → 8`. Values outside 4-8 clamp to nearest bound.

**Rationale**: Graceful handling of edge cases without data loss. Users won't see errors for previously valid configurations.

**Implementation**:
```typescript
const VALID_DURATIONS = [4, 6, 8] as const
const videoDurationSchema = z.number().transform(n => {
  const clamped = Math.max(4, Math.min(8, n))
  return VALID_DURATIONS.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  )
}).pipe(z.enum([4, 6, 8]))
```

**Alternatives considered**:
- Reject invalid durations with validation error — breaks existing configs
- Default to 6 for any invalid value — loses user intent (a 4 should stay 4)

## R-007: Backend Task Routing

**Context**: `aiVideoOutcome.ts` currently has a single code path (animate). Need routing for `image-to-video` and `ref-images-to-video`.

**Decision**: Add a `switch` on `task` in the executor to compose different `GenerateVideoRequest` params:
- `image-to-video`: `sourceMedia` only (existing pattern)
- `ref-images-to-video`: `sourceMedia` + `referenceMedia` from `videoGeneration.refMedia`

The `aiGenerateVideo.ts` operation already has `buildVeoParams()` handling both patterns (`sourceMedia` only → `params.image`, `sourceMedia` + `referenceMedia` → `config.referenceImages`). No changes needed there.

**Rationale**: The Veo API integration layer already supports both patterns. Only the outcome executor needs routing logic.

**Alternatives considered**:
- Restructure `aiGenerateVideo.ts` — unnecessary, it already handles both patterns correctly

## R-008: PromptComposer Props Summary

After all changes, PromptComposer will accept these new optional props:

| New Prop | Type | Default | Purpose |
|----------|------|---------|---------|
| `modelOptions` | `readonly SelectOption[]` | `AI_IMAGE_MODELS` | Configurable model list |
| `duration` | `number` | — | Current duration value |
| `onDurationChange` | `(d: number) => void` | — | Duration change handler |
| `durationOptions` | `readonly SelectOption[]` | — | Duration options (4s, 6s, 8s) |
| `hideRefMedia` | `boolean` | `false` | Hide ref media strip + add button |

All are optional with backward-compatible defaults, so existing PromptComposer usages (AIImageConfigForm, FrameGenerationSection) require zero changes.
