# EPIC: Outcome-based Create (Transform v3)

## Goal

Replace user-authored `transformNodes` with a **Create tab** where admins pick an **Outcome** and fill a small set of parameters. Guest runtime and Cloud Functions operate on **responses** only. `transformNodes` become deprecated (kept only for backward compatibility, ignored by runtime).

## Non-goals

- No advanced mode
- No template DSL in Firestore for MVP
- No migration of existing prelaunch data
- No fallback logic for old sessions (abandon them)
- No text generation stage (future - see [future-patterns.md](./future-patterns.md))
- No video/gif implementation (schema stubs only)

---

## PRD Overview

| PRD | Name | Description | Status |
|-----|------|-------------|--------|
| [1A](./prd-1a-schemas.md) | Schema Foundations | New Zod schemas in shared package | ✅ Complete |
| [1B](./prd-1b-experience-create.md) | Experience Outcome Config | Add `outcome` to experience, publish validation | ✅ Complete |
| [1C](./prd-1c-session-responses.md) | Session Responses | Unified responses, guest runtime writes | ✅ Complete |
| [2](./prd-2-admin-create-ux.md) | Admin Create Tab UX | Create tab UI with prompt editor | ✅ Complete |
| [3](./prd-3-job-cloud-functions.md) | Job + Cloud Functions | Job snapshot, dispatcher, image outcome | |
| [4](./prd-4-cleanup.md) | Cleanup & Guardrails | Remove dead code, safety checks | |

---

## Dependency Graph

```
┌─────────────────┐
│   PRD 1A        │
│   Schemas       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ PRD   │ │ PRD   │  ◄── Can be developed in PARALLEL
│ 1B    │ │ 1C    │
│ Exp.  │ │ Sess. │
└───┬───┘ └───┬───┘
    │         │
    ▼         │
┌───────┐     │
│ PRD 2 │     │
│ Admin │     │
│ UX    │     │
└───┬───┘     │
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│   PRD 3         │
│   Job + CF      │  ◄── Integration point
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PRD 4         │
│   Cleanup       │
└─────────────────┘
```

### Parallelization Summary

| After completing | You can start in parallel |
|------------------|---------------------------|
| PRD 1A (Schemas) | PRD 1B + PRD 1C |
| PRD 1B (Experience) | PRD 2 (Admin UX) |
| PRD 1B + 1C | PRD 3 (Job + CF) |
| PRD 3 | PRD 4 (Cleanup) |

---

## Outcome Schema

### Final Structure

```ts
// Located at draft.outcome and published.outcome
outcome: {
  // Outcome type
  type: 'image' | 'gif' | 'video' | null,

  // Shared (top-level)
  captureStepId: string | null,     // Capture step for source media
  aiEnabled: boolean,               // Global toggle for AI generation

  // Image generation config (preserved when switching outcomes)
  imageGeneration: {
    prompt: string,
    refMedia: MediaReference[],
    model: AIImageModel,
    aspectRatio: AIImageAspectRatio,
  },

  // Type-specific options (discriminated union)
  options: ImageOptions | GifOptions | VideoOptions | null,
}
```

### Field Placement Rationale

| Field | Location | Rationale |
|-------|----------|-----------|
| `captureStepId` | Top level | Same source media regardless of output format |
| `aiEnabled` | Top level | Global toggle for all AI stages (future: text, video) |
| `imageGeneration` | Named block | Preserved when switching outcomes; clear naming for future stages |
| `options` | Discriminated union | Type-specific settings; can reset on switch without losing shared config |

### Passthrough Mode

| `aiEnabled` | `captureStepId` | Behavior |
|-------------|-----------------|----------|
| `true` | `null` | Prompt-only generation |
| `true` | set | Image-to-image transformation |
| `false` | set | Passthrough (apply overlay only) |
| `false` | `null` | **Invalid** - validation error |

### Multiple Capture Steps

For experiences with multiple capture steps (e.g., "user photo" + "friend photo"):
- `captureStepId` specifies the **primary** source for image-to-image transformation
- Additional captures can be referenced via `@{step:capture_name}` in the prompt
- This provides flexibility without complicating the schema

### Switching Outcomes

When user switches between image/gif/video:
- `imageGeneration` block **preserved** (prompt, refMedia, model, aspectRatio)
- `options` block **reset to defaults** for new outcome type

---

## Schema Changes Summary

| Schema | PRD | Change |
|--------|-----|--------|
| `mediaDisplayNameSchema` | 1A | NEW - validation for mention-safe names |
| `outcomeSchema` | 1A | NEW - outcome config with `captureStepId` and imageGeneration |
| `sessionResponseSchema` | 1A | NEW - unified response with `stepName`, `data` for all typed data |
| `experienceConfigSchema` | 1B | Add `outcome` field |
| `sessionSchema` | 1C | Add `responses[]`, deprecate `answers[]` + `capturedMedia[]` |
| `jobSnapshotSchema` | 3 | Add `outcome`, update `sessionInputs` |

---

## Session Response Schema

```ts
sessionResponse: {
  stepId: string,
  stepName: string,           // For @{step:...} resolution (input AND capture)
  stepType: string,           // No separate kind enum
  data: SessionResponseData,  // Typed union (see below)
  createdAt: number,
  updatedAt: number,
}

// SessionResponseData is a discriminated union:
type SessionResponseData =
  | string                    // Simple inputs (scale, yesNo, shortText, longText)
  | MultiSelectOption[]       // Multi-select input
  | MediaReference[]          // Capture steps (photo, video, gif)
```

### Data Shape by Step Type

The `data` field holds typed data, with interpretation based on `stepType`:

| Step Type | `data` |
|-----------|--------|
| `input.shortText` | `"user text"` (string) |
| `input.longText` | `"user text"` (string) |
| `input.scale` | `"1"` to `"5"` (string) |
| `input.yesNo` | `"yes"` or `"no"` (string) |
| `input.multiSelect` | `MultiSelectOption[]` (with promptFragment, promptMedia) |
| `capture.photo` | `MediaReference[]` (1 item) |
| `capture.gif` | `MediaReference[]` (4 items) |
| `capture.video` | `MediaReference[]` (1 item) |

**Key design decisions:**
- **Unified `data` field** - replaces separate `value`/`context` for better type safety
- **No separate `media` field** - capture media stored in `data` as `MediaReference[]`
- **Captures always use array** - even single photo/video uses `[MediaReference]` for consistency
- **`@{step:...}` works for all steps** - inputs resolve to data value, captures resolve to media in data
- **Deprecated fields not written** - `answers[]` and `capturedMedia[]` exist for backward compatibility but new sessions only write to `responses[]`

---

## Key Decisions (Locked)

### Schema Design
1. **No `responseKindSchema`** - use `stepType` directly
2. **`captureStepId` at top level** - shared across all outcome types (renamed from `sourceStepId`)
3. **`aiEnabled` at top level** - global toggle for all AI stages
4. **`imageGeneration` not `ai`** - clear naming for future stages
5. **`options` as discriminated union** - type-specific, can reset on switch

### Data Handling
6. **Unified `data` field in responses** - replaces separate `value`/`context` for better type safety
7. **`stepName` in responses** - for direct `@{step:...}` prompt resolution (both input AND capture steps)
8. **Captures always use `MediaReference[]`** - stored in `data` as array, even single photo/video
9. **MultiSelect uses `MultiSelectOption[]`** - full option objects with promptFragment/promptMedia stored in `data`
10. **Abandon old sessions** - no migration, no fallback logic
11. **`transformNodes` always `[]`** - kept in schema but ignored
12. **Deprecate `answers[]` and `capturedMedia[]`** - keep for backward compatibility, new sessions only write to `responses[]`

### Overlays
13. **Per aspect ratio** - `projectContext.overlays[aspectRatio]`
14. **No experience toggle** - project owns overlay config

---

## MVP Scope

| Feature | Status |
|---------|--------|
| Image outcome | **Implemented** |
| Passthrough mode (`aiEnabled: false`) | **Implemented** |
| GIF outcome | Schema stub, "coming soon" in UI |
| Video outcome | Schema stub, "coming soon" in UI |
| Text generation stage | Future (see [future-patterns.md](./future-patterns.md)) |

---

## Success Criteria

- [ ] Admin can configure Create outcome (image) without seeing nodes
- [ ] Admin can toggle AI on/off (passthrough mode)
- [ ] Switching outcomes preserves imageGeneration config
- [ ] Guest flow writes unified `responses[]` with `stepName`
- [ ] Cloud Functions execute from `job.snapshot.outcome`
- [ ] Prompt mentions (`@{step:...}`, `@{ref:...}`) resolve correctly
- [ ] Old `transformNodes` code paths are removed

---

## Related Documents

- [Future Patterns](./future-patterns.md) - Linear chain generation, text stage, video stage
- [055-lexical-prompt-editor spec](../../specs/055-lexical-prompt-editor/spec.md) - Prompt editor implementation
- [Session schema](../../packages/shared/src/schemas/session/session.schema.ts)
- [Experience schema](../../packages/shared/src/schemas/experience/experience.schema.ts)
