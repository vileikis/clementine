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

### D7: Guest Progress Visibility
**Question**: Q7 - Should guests see job progress details?
**Decision**: **Options B + C combined** - Progress bar AND step messages
**Rationale**: Good UX without exposing implementation details.

Guest sees:
- Progress bar (percentage)
- Generic step message: "Removing background...", "Applying AI magic...", "Finishing up..."

---

### D8: GIF Pipeline Complexity
**Question**: Q8 - How to handle verbose GIF configs?
**Decision**: **Option A** - Keep verbose config for MVP
**Rationale**: Explicit is good, evaluate batch/composite nodes based on real usage.

---

### D9: AI Model Retry Strategy
**Question**: Q9 - How to handle AI model failures?
**Decision**: **Option B** - Retry node 3 times with exponential backoff
**Rationale**: Handles transient failures, fails fast on persistent issues.

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
**Decision**: **Restrict to ONE transform step per experience for MVP**
**Rationale**: Adding is easier than removing. Simplifies validation and mental model.

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
  stepId: "transform1",
  experienceId: "exp1",

  // INPUTS: Root-level variable definitions
  variableMappings: {
    pet: { stepId: "step1", type: "answer" },
    phrase: { stepId: "step2", type: "answer" },
    photo: { stepId: "step3", type: "capturedMedia" }
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

---

## Summary

| # | Topic | Decision |
|---|-------|----------|
| D1 | Storage Location | `/experiences/{expId}/transformConfigs/{stepId}` |
| D2 | Draft/Published | Separate docs with `configType` field |
| D3 | Intermediate Format | In-memory processing |
| D4 | Node References | `previousNode` + named references |
| D5 | BackgroundSwap | Accepts assets AND node outputs |
| D6 | Error Security | Sanitized client errors, detailed server logs |
| D7 | Guest Progress | Progress bar + generic step messages |
| D8 | GIF Complexity | Verbose config for MVP |
| D9 | AI Retries | 3 retries with exponential backoff |
| D10 | Timeout | 10 minutes |
| D11 | Validation | Loose draft, strict publish |
| D12 | Prompt UI | Rich editor with Insert Variable |
| D13 | Preview | Use ExperiencePreviewModal |
| D14 | Reordering | Allow any, validate on save |
| D15 | Step Deletion | Warn + allow + fix before publish |
| D16 | Transform Position | Must be last step |
| D17 | Multiple Transforms | One per experience (MVP) |
| D18 | Templates | Defer, use experience duplication |
| D19 | Versioning | Auto-version on publish |
| D20 | Step Naming | Add `name` field to all steps |
| D21 | Variable Location | Root-level `variableMappings` in transform config |
| D22 | Variable Creation | Admin-defined, decoupled from step names |
