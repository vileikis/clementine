# Research: LLM Models Cleanup & UI Adjustments

**Feature**: 090-llm-models-cleanup
**Date**: 2026-03-06

## Research Task 1: Where is `gemini-3-pro-image-preview` referenced?

### Decision: Remove from 5 source files across 3 workspaces

### Findings

Full-text search identified the following active source code references:

| # | File | Location | What to do |
| - | ---- | -------- | ---------- |
| 1 | `packages/shared/src/schemas/experience/experience-config.schema.ts` | Line ~27-31, `aiImageModelSchema` Zod enum | Remove enum value. Remaining values: `gemini-2.5-flash-image`, `gemini-3.1-flash-image-preview` |
| 2 | `functions/src/services/ai/config.ts` | Line ~39-40, `MOCKED_AI_CONFIG` | Change to next valid model (`gemini-3.1-flash-image-preview` or `gemini-2.5-flash-image`) |
| 3 | `functions/src/services/transform/operations/aiGenerateImage.ts` | Lines ~154-164, comment + `getLocationForModel()` | Remove comment and model case from routing function |
| 4 | `functions/src/services/ai/providers/types.ts` | Line ~15, comment only | Remove or update comment |
| 5 | `apps/clementine-app/src/domains/experience/create/lib/model-options.ts` | Lines ~22-26, `AI_IMAGE_MODELS` array | Remove the `{ value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' }` entry |

Additionally, `packages/shared/dist/` contains auto-generated declaration files that will be regenerated on build.

### Alternatives considered
- **Soft-deprecate with a flag**: Rejected — the brief explicitly says "completely remove"
- **Keep in schema as deprecated**: Rejected — would allow selection in UI

---

## Research Task 2: How to handle existing Firestore documents with the removed model?

### Decision: Rely on Zod schema flexibility at read time

### Rationale
- Firestore documents that reference `gemini-3-pro-image-preview` are historical/legacy
- The Zod enum removal means new writes cannot use this model
- For reads: if the app uses `.parse()` on Firestore data, it will throw on the removed value
- **Mitigation**: Use `.safeParse()` or `.catch()` at the read boundary, or update the schema to accept but not expose the deprecated value
- Given that this model is already deprecated and the brief says to remove it, the simplest approach is to ensure read paths handle unknown model values gracefully (which they should already do via optional/default patterns)

### Alternatives considered
- **Firestore migration script**: Rejected — overkill for a model name field; existing documents can be updated when next edited
- **Keep value in Zod but hide from UI**: Rejected — contradicts the brief's "completely remove" directive

---

## Research Task 3: How to hide the Enhance Prompt control?

### Decision: Use a feature flag constant (`ENABLE_ENHANCE_PROMPT = false`) in the ControlRow component

### Rationale
- The enhance control in `ControlRow.tsx` already conditionally renders based on `modality.supports.enhance` and `controls?.enhance !== undefined`
- The simplest non-destructive hiding approach is to add a constant flag that short-circuits rendering
- This preserves all code (context types, control logic, backend integration) intact
- Reactivation requires changing one constant to `true`

### Implementation approach
- Add `const ENABLE_ENHANCE_PROMPT = false` near the top of `ControlRow.tsx`
- Wrap the enhance control's render block with `{ENABLE_ENHANCE_PROMPT && (...)}`
- No CSS changes needed — conditional rendering is cleaner than `display: none`
- No layout impact since the control is one chip in a flex row; removing it from the flow won't break spacing

### Alternatives considered
- **CSS `display: none`**: Rejected — still renders in DOM, adds unnecessary weight
- **Remove from modality-definitions.ts** (`enhance: false`): Rejected — this would also disable the backend flag, which is a broader change than just hiding the UI control
- **Feature flag in environment/config**: Rejected — overkill for a single toggle; a code constant is simpler and more discoverable
