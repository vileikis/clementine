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

## Variable Referencing System

### Decision: Auto-Generated Variables with Override Option

**Approach**: Variables auto-generated from step names (camelCase), admin can rename if needed.

**How it works**:

1. **Auto-generation**: When transform step is added, system scans previous input steps and generates variables:
   ```
   Step: "Pet Choice" (input.multiSelect) → Variable: {{petChoice}}
   Step: "Your Phrase" (input.shortText)  → Variable: {{yourPhrase}}
   Step: "Photo" (capture.photo)          → Variable: {{photo}} (media reference)
   ```

2. **Admin UI**: Shows "Available Variables" panel:
   ```
   ┌─────────────────────────────────────────┐
   │ Available Variables                      │
   ├─────────────────────────────────────────┤
   │ {{petChoice}}    ← Pet Choice (Step 1)  │
   │ {{yourPhrase}}   ← Your Phrase (Step 2) │
   │ {{photo}}        ← Photo (Step 3)       │
   │                                          │
   │ [Rename Variable...]                     │
   └─────────────────────────────────────────┘
   ```

3. **Insert Variable**: Button in prompt editor shows dropdown of variables

4. **Override**: Admin can rename variables for clarity:
   ```
   {{petChoice}} → {{pet}}  (renamed)
   ```

5. **Storage**: Transform config stores mapping:
   ```typescript
   variableMappings: {
     pet: { type: "answer", stepId: "step1" },
     yourPhrase: { type: "answer", stepId: "step2" },
     photo: { type: "capturedMedia", stepId: "step3" }
   }
   ```

6. **Sync**: If step is renamed, variable name stays the same (decoupled after creation)

**Benefits**:
- Human-readable by default
- No manual setup required
- Can be customized when needed
- Decoupled from step names after creation

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
| D20 | Variables | Auto-generated from step names |
