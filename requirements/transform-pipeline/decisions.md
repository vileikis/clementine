# Transform Pipeline - Decisions Log

## Status: In Progress
**Last Updated**: 2026-01-19

---

## Architecture Decisions

### D1: Transform Config Storage Location
**Question**: Q1 - Where to store transform configs?
**Decision**: **Option A** - `/experiences/{expId}/transformConfigs/{stepId}`
**Rationale**: Keeps config close to experience, security rules deny client access to subcollection.

---

### D2: Draft vs Published Config Handling
**Question**: Q2 - How to handle draft vs published?
**Decision**: **Option A** - Separate documents with `configType` field
**Rationale**: Simpler querying, consistent with experience versioning pattern.

```
/experiences/{expId}/transformConfigs/{stepId}_draft
/experiences/{expId}/transformConfigs/{stepId}_published
```

---

### D3: Intermediate Node Output Format
**Question**: Q3 - Node output format for intermediate steps?
**Decision**: **Option C** - In-memory processing, only final output to storage
**Rationale**: Faster, less storage usage. Acceptable for MVP pipeline lengths.

---

### D4: Node Output Referencing
**Question**: Q4 - How should nodes reference other nodes' outputs?
**Decision**: **Option C** - Both `previousNode` and named node references
**Rationale**: Simple default (previous), explicit for branching pipelines.

```typescript
// Simple linear pipeline
input: { source: "previousNode" }

// Branching pipeline
input: { source: "node", nodeId: "removeBg1" }
```

---

### D5: BackgroundSwap Dynamic Backgrounds
**Question**: Q5 - Should BackgroundSwap support node outputs?
**Decision**: **Option B** - Accept both static assets AND node outputs
**Rationale**: Enables AI-generated backgrounds use case.

```typescript
backgroundSource:
  | { type: "asset", asset: MediaReference }
  | { type: "node", nodeId: string }
```

---

### D6: Error Message Security
**Question**: Q6 - How to prevent prompt/config leakage in errors?
**Decision**: **Option C** - Detailed logs server-side, sanitized errors to client
**Rationale**: Best balance of debugging capability and security.

---

### D29: Transform Error UX
**Question**: What should guests see when transform pipeline fails?
**Decision**: Friendly error state with restart option

**Error state UI**:
```
┌─────────────────────────────────────────┐
│                                          │
│            😕                            │
│                                          │
│   Oops, something went wrong.            │
│                                          │
│   Please contact the event organizer     │
│   or start over.                         │
│                                          │
│         [ Start Over ]                   │
│                                          │
└─────────────────────────────────────────┘
```

**Behavior**:
- "Start Over" button restarts the experience from the beginning
- Creates new session, clears all answers and captured media
- No retry option (to avoid infinite loops on persistent errors)

**Server-side**:
- Full error details logged in Cloud Functions
- Job document stores error code and message for debugging
- No technical details exposed to guest

---

### D7: Guest Progress Visibility
**Question**: Q7 - Should guests see job progress details?
**Decision**: **Generic loading state only** (simplified for MVP)

**Rationale**: Keep MVP simple, no custom loading messages.

**Guest sees during processing**:
- Loading spinner/animation
- Generic message: "Creating your masterpiece..." (hardcoded)
- No progress bar or step-specific messages for MVP

**Future consideration**: Add customizable loading messages and progress indicators.

---

### D8: GIF Pipeline Complexity
**Question**: Q8 - How to handle verbose GIF configs?
**Decision**: **Option A** - Keep verbose config for MVP
**Rationale**: Explicit is good, evaluate batch/composite nodes based on real usage.

---

### D9: AI Model Retry Strategy
**Question**: Q9 - How to handle AI model failures?
**Decision**: **No retries** - Single attempt, show error state on failure

**Rationale**:
- Simplifies implementation for MVP
- Users see error state and can restart experience
- Server-side logging captures errors for debugging
- Avoids complexity of retry logic and state management

**Error handling flow**:
1. AI call fails (rate limit, model error, timeout)
2. Job marked as failed with error details
3. Client shows friendly error state
4. User can restart experience

---

### D10: Pipeline Execution Timeout
**Question**: Q10 - Max pipeline execution time?
**Decision**: **10 minutes** for MVP
**Rationale**: Sufficient for complex AI pipelines, can increase for video later.

---

### D11: Pipeline Validation Strategy
**Question**: Q11 - How to validate pipeline config?
**Decision**: **Option A modified** - Loose validation on draft save, strict on publish

**Draft save**: Basic schema validation only (Zod)
**Publish**: Full validation including:
- Step references exist and are before transform step
- Node references are valid
- Required assets exist
- Prompt variables have mappings

---

### D12: Dynamic Prompt UI
**Question**: Q12 - How should admin configure dynamic prompts?
**Decision**: **Option B** - Rich editor with "Insert Variable" button
**Rationale**: User-friendly while still allowing direct `{{variable}}` typing.

---

### D13: Pipeline Preview
**Question**: Q13 - How to preview transform pipeline?
**Decision**: **Option A** - Use existing ExperiencePreviewModal with preview session
**Rationale**: Reuse existing infrastructure, no separate preview needed.

---

### D14: Node Reordering Constraints
**Question**: Q14 - How to handle node reordering?
**Decision**: **Option A** - Allow any order, validate on save/publish
**Rationale**: Simpler implementation, clear error messages.

---

### D15: Step Deletion with References
**Question**: Q15 - What happens when deleting a referenced step?
**Decision**: **Option D** - Warning + allow deletion + require manual fix before publish
**Rationale**: Aligns with loose draft / strict publish validation strategy (D11).

Flow:
1. User tries to delete step
2. System warns: "This step is referenced by Transform Pipeline. Delete anyway?"
3. If confirmed, step deleted, transform config has broken reference
4. Publish validation fails until admin fixes references

---

### D16: Transform Step Position
**Question**: Q16 - Should transform step have position constraints?
**Decision**: **Option B** - Must be last step in experience
**Rationale**: Simpler mental model, all data collection happens before transform.

---

### D17: Multiple Transform Steps
**Question**: Q17 - Allow multiple transform steps per experience?
**Decision**: **Restrict to ONE transform per experience**
**Rationale**: Adding is easier than removing. Simplifies validation and mental model.

---

### D23: Transform Storage Location
**Question**: Should transform config be in separate server-only collection?
**Decision**: **Embed in experience document** (no separate `transformConfigs` collection)

**Rationale**:
- Competitor validation: Major players don't hide prompts, customers don't churn
- Speed to market: Separate collection = separate CRUD, sync logic, versioning
- Concierge phase: Early users are trusted partners
- Migration later: Moving to subcollection is mechanical work if needed

**Guardrails**:
- Don't market "secure prompts" as a feature until implemented
- Document as intentional technical debt
- Revisit trigger: Enterprise customer requests, proven prompt theft

---

### D24: Transform Schema Position
**Question**: Should transform be in steps array or separate field?
**Decision**: **Separate `transform` field** at same level as `steps`

**Schema**:
```typescript
experienceConfigSchema = z.object({
  steps: z.array(stepSchema),        // User-facing steps only
  transform: transformConfigSchema.nullable()  // Separate slot
})
```

**Rationale**:
- Clean semantic separation: steps = user-facing, transform = processing
- No reordering concerns - it's a field, not an array item
- Optional by nature (`null` = no transform)
- Clear mental model: "Users go through steps, then we transform"

**Runtime adaptation**: Virtual step injection - append transform as synthetic step at end when iterating.

---

### D25: Transform Always Last
**Question**: Can transform be positioned anywhere in experience?
**Decision**: **Transform is always last** - enforced by schema (separate slot)
**Rationale**: Natural endpoint. All data must be collected before processing.

---

### D18: Pipeline Templates
**Question**: Q18 - Support shareable pipeline templates?
**Decision**: **Defer** - Use experience duplication instead
**Rationale**: Experience duplication (future) will copy transform configs. Standalone templates problematic due to step references.

---

### D19: Pipeline Versioning
**Question**: Q19 - Pipeline versioning and rollback?
**Decision**: **Option B** - Auto-version on publish, synced with experience version
**Rationale**: Consistent with experience versioning pattern.

---

## Step Naming

### Decision: Add `name` Field to All Steps

**Problem**: Steps lack consistent identifiers for display and variable referencing.

**Solution**: Add required `name` field to base step schema:

```typescript
// All steps get this
{
  id: z.uuid(),
  type: z.literal('capture.photo'),
  name: z.string().min(1).max(50),  // NEW: Required
  config: { ... }
}
```

**Auto-generated defaults on creation**:
- "Info 1", "Info 2"
- "Scale Question 1"
- "Photo Capture 1", "Photo Capture 2"
- "AI Transform"

**Benefits**:
- Differentiates multiple steps of same type
- Human-readable in step list
- Used for variable name suggestions

---

## Variable Referencing System

### Decision: Root-Level Variable Mappings (Decoupled from Steps)

**Approach**: Variables defined at transform config root level, separate from nodes.

**Structure**:
```typescript
{
  // INPUTS: Root-level variable definitions
  variableMappings: {
    pet: {
      stepId: "step1",
      type: "answer",
      defaultValue: "cat"  // Fallback if step answer is empty/missing
    },
    phrase: {
      stepId: "step2",
      type: "answer",
      defaultValue: "Hello!"  // Fallback value
    },
    photo: {
      stepId: "step3",
      type: "capturedMedia",
      defaultValue: null  // No fallback for required media
    }
  },

  // PIPELINE: Nodes reference variables
  nodes: [
    {
      type: "removeBackground",
      input: { source: "variable", variableName: "photo" }
    },
    {
      type: "aiImage",
      promptTemplate: "Transform with {{pet}}. Text: {{phrase}}"
    }
  ],

  outputFormat: "image"
}
```

**Variable Mapping with Default Values**:
```typescript
variableMappingSchema = z.object({
  type: z.enum(['answer', 'capturedMedia']),
  stepId: z.string(),
  field: z.string().nullable().default(null),

  // Default/fallback value if step data is empty or missing
  defaultValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
  ]).default(null)
})
```

**Mental Model**:
```
INPUTS (variableMappings)  →  PIPELINE (nodes)  →  OUTPUT
```

**Admin UI Flow**:
1. Admin clicks "+ Add" in INPUTS section
2. Modal shows available steps (by name): "Pet Choice", "Photo Capture 1"
3. Select step
4. System suggests variable name (camelCase from step name): `petChoice`
5. Admin can accept or rename to `pet`
6. Variable added to mappings, available in nodes

**Why root-level (not input node)**:
- Clean separation: inputs vs transforms
- Single place to manage all variable mappings
- Easy validation: every `{{var}}` must exist in mappings
- Nodes stay focused on transformation logic

**Benefits**:
- Step renames don't break prompts (decoupled)
- Clear mental model
- Easy to validate completeness
- Default values provide graceful fallback

---

## Transform Nodes

### Decision: MVP Node Set with User-Friendly Names

**Node Types (MVP)**:

| Internal Name | Display Name | Icon | Description |
|---------------|--------------|------|-------------|
| `removeBackground` | **Cut Out** | ✂️ | Remove background, keep subject |
| `composite` | **Combine** | 🔲 | Layer multiple images together |
| `backgroundSwap` | **Background Swap** | 🖼️ | Replace background (convenience node) |
| `aiImage` | **AI Image** | ✨ | Generate/transform with AI |

**Future Nodes**:

| Internal Name | Display Name | Icon | Description |
|---------------|--------------|------|-------------|
| `aiVideo` | **AI Video** | 🎬 | Generate video with AI |
| `aiText` | **AI Text** | 📝 | Generate dynamic text |

**Node Details**:

1. **Cut Out** (`removeBackground`)
   - Input: Image
   - Output: Image with transparent background
   - Config: `mode: "keepSubject" | "keepBackground"`

2. **Combine** (`composite`)
   - Input: Multiple layers
   - Output: Single composited image/video
   - Config: `layers[]` with background, content, overlay
   - Handles: static + static = image, static + video = video

3. **Background Swap** (`backgroundSwap`)
   - Input: Image with subject
   - Output: Subject on new background
   - Config: `backgroundSource` (asset or node output)
   - Note: Convenience node - internally uses removeBackground + composite
   - Simplifies common use case without manual pipeline setup

4. **AI Image** (`aiImage`)
   - Input: Image + prompt + references
   - Output: AI-generated/transformed image
   - Config: `promptTemplate`, `model`, `aspectRatio`, `references[]`

**UI Grouping**:
```
BASIC
  - Cut Out
  - Combine
  - Background Swap

AI-POWERED
  - AI Image
  (Future: AI Video, AI Text)
```

---

## Summary

| # | Topic | Decision |
|---|-------|----------|
| D1 | ~~Storage Location~~ | ~~`/experiences/{expId}/transformConfigs/{stepId}`~~ → See D23 |
| D2 | ~~Draft/Published~~ | ~~Separate docs~~ → Embedded, follows experience versioning |
| D3 | Intermediate Format | In-memory processing |
| D4 | Node References | `previousNode` + named references + variables |
| D5 | BackgroundSwap | Accepts assets AND node outputs |
| D6 | Error Security | Sanitized client errors, detailed server logs |
| D7 | Guest Progress | Generic loading state only (no customization) |
| D8 | GIF Complexity | Verbose config for MVP |
| D9 | AI Retries | **No retries** - single attempt, show error state |
| D10 | Timeout | 10 minutes |
| D11 | Validation | Loose draft, strict publish |
| D12 | Prompt UI | Rich editor with Insert Variable |
| D13 | Preview | Use ExperiencePreviewModal |
| D14 | Reordering | Allow any order for nodes, validate on save |
| D15 | Step Deletion | Warn + allow + fix before publish |
| D16 | Transform Position | Always last (enforced by schema) |
| D17 | Multiple Transforms | One per experience |
| D18 | Templates | Defer, use experience duplication |
| D19 | Versioning | Auto-version on publish (follows experience) |
| D20 | Step Naming | Add `name` field to all steps |
| D21 | Variable Location | Root-level `variableMappings` in transform |
| D22 | Variable Creation | Admin-defined, decoupled from step names |
| D23 | Transform Storage | **Embed in experience doc** (no separate collection) |
| D24 | Transform Schema | **Separate `transform` field** (not in steps array) |
| D25 | Transform Position | Always last, enforced by separate slot |
| D26 | Variable Defaults | Support `defaultValue` for fallback |
| D27 | Node Types (MVP) | Cut Out, Combine, Background Swap, AI Image |
| D28 | Node Naming | User-friendly names with icons |
| D29 | Error UX | Friendly message + "Start Over" (restarts experience) |
