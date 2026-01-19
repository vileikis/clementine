# Transform Pipeline - Open Questions

## Architecture Decisions

### Q1: Where to store Transform Configs?

**Context**: Transform configs must be server-only (not readable by guests). Need to decide Firestore path structure.

**Options**:

| Option | Path | Pros | Cons |
|--------|------|------|------|
| A | `/experiences/{expId}/transformConfigs/{stepId}` | Close to experience data, easy to manage | Experience collection is workspace-scoped, may complicate security rules |
| B | `/projects/{projId}/transformConfigs/{configId}` | Project-scoped like jobs | Requires extra lookup to find config for experience |
| C | `/transformConfigs/{expId}_{stepId}` | Simple flat structure | Orphan cleanup harder, no natural parent |
| D | Separate field in experience doc (encrypted or admin-only read) | Everything in one place | Complicates experience schema, harder to secure |

**Recommendation**: Option A - keeps config close to experience, can use security rules to deny guest access to subcollection.

**Decision**: _______________

---

### Q2: How to handle draft vs published transform configs?

**Context**: Experiences have `draft` and `published` configs. Transform configs need to sync.

**Options**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Single doc with `configType: draft|published` field | Simple document structure | Need two docs per step |
| B | Store as `draftConfig` and `publishedConfig` fields in single doc | One doc per step | Larger docs, awkward querying |
| C | Separate subcollections: `/draft/{stepId}` and `/published/{stepId}` | Clear separation | More paths to manage |

**Recommendation**: Option A - simple, mirrors experience pattern.

**Decision**: _______________

---

### Q3: Node output format for intermediate steps?

**Context**: In multi-node pipelines, intermediate nodes produce output that feeds into next node. What format?

**Options**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Always PNG with alpha | Preserves transparency from removeBackground | Larger files |
| B | Format depends on node type | Optimized per operation | More complex logic |
| C | Store in memory, only final output to storage | Faster, less storage | More memory usage, can't resume |

**Recommendation**: Option C for MVP (in-memory), with Option A as fallback for long pipelines.

**Decision**: _______________

---

### Q4: How should nodes reference other nodes' outputs?

**Context**: Use case 4 shows need to reference specific node output (not just previous node).

**Options**:

| Option | Description | Example |
|--------|-------------|---------|
| A | `previousNode` only | `{ "source": "previousNode" }` |
| B | Named node reference | `{ "source": "node", "nodeId": "node2" }` |
| C | Both + implicit chaining | Default to previous, explicit for branching |

**Recommendation**: Option C - flexible while simple for linear pipelines.

**Decision**: _______________

---

### Q5: Should BackgroundSwap support dynamic backgrounds from other nodes?

**Context**: Use case 4 wants to use AI-generated image as background for another image.

**Options**:

| Option | Description |
|--------|-------------|
| A | BackgroundSwap only accepts static asset references |
| B | BackgroundSwap can accept node output as background |
| C | Create new node type `compositeImages` for this use case |

**Recommendation**: Option B - more flexible, natural extension.

**Schema change needed**:
```typescript
backgroundSwapNodeSchema = z.object({
  // ... existing fields ...

  // Either static asset OR node reference
  backgroundSource: z.discriminatedUnion('type', [
    z.object({ type: z.literal('asset'), asset: mediaReferenceSchema }),
    z.object({ type: z.literal('node'), nodeId: z.string() }),
  ])
})
```

**Decision**: _______________

---

## Security Questions

### Q6: How to prevent prompt/config leakage in error messages?

**Context**: If a pipeline fails, error details could expose prompts.

**Options**:

| Option | Description |
|--------|-------------|
| A | Generic error messages only (e.g., "AI processing failed") |
| B | Detailed errors for admins, generic for guests |
| C | Log details server-side, return sanitized errors |

**Recommendation**: Option C - best debugging + security.

**Decision**: _______________

---

### Q7: Should guests see job progress details?

**Context**: Job document has progress info (current node, message). How much to expose?

**Options**:

| Option | What guest sees |
|--------|-----------------|
| A | Nothing - just loading animation |
| B | Percentage/progress bar only |
| C | Current step message (e.g., "Removing background...") |
| D | Full progress including node names |

**Recommendation**: Option B or C - improves UX without exposing implementation.

**Decision**: _______________

---

## Implementation Questions

### Q8: GIF pipeline complexity

**Context**: Use case 5 shows 9 nodes for a 4-frame GIF. This is verbose.

**Options**:

| Option | Description |
|--------|-------------|
| A | Keep verbose config - explicit is good |
| B | Add "batch" mode to nodes (process array of inputs) |
| C | Create high-level composite nodes (e.g., `gifWithBackgrounds`) |
| D | Allow loop/iteration in pipeline config |

**Recommendation**: Start with A for MVP, evaluate B or C based on real usage.

**Decision**: _______________

---

### Q9: How to handle AI model failures/retries?

**Context**: AI models can fail (rate limits, content filters, timeouts).

**Options**:

| Option | Description |
|--------|-------------|
| A | Fail entire pipeline on first error |
| B | Retry node X times before failing |
| C | Allow fallback prompts/models per node |

**Recommendation**: Option B with 3 retries, exponential backoff.

**Decision**: _______________

---

### Q10: Max pipeline execution time?

**Context**: Cloud Tasks have max timeout of 30 minutes (for HTTP targets) or 24 hours (for App Engine).

**Options**:

| Limit | Use case |
|-------|----------|
| 5 min | Simple transforms |
| 10 min | Complex AI pipelines |
| 30 min | Video generation |

**Recommendation**: 10 min for MVP, increase for video support.

**Decision**: _______________

---

### Q11: How to validate pipeline config at save time?

**Context**: Admin could create invalid pipeline (e.g., reference non-existent step).

**What to validate**:
- [ ] Step references point to existing steps
- [ ] Step references are to steps BEFORE transform step
- [ ] Node references point to existing nodes
- [ ] Node references don't create cycles
- [ ] Required assets exist
- [ ] Prompt template variables have mappings

**Options**:

| Option | Description |
|--------|-------------|
| A | Client-side validation only |
| B | Server-side validation on save |
| C | Validation endpoint before save |
| D | Deferred validation at job execution |

**Recommendation**: Option B + D - validate structure on save, validate assets/references at execution.

**Decision**: _______________

---

## UX Questions

### Q12: How should admin configure dynamic prompts?

**Context**: Prompts with {{variables}} need to map to step answers.

**Options**:

| Option | Description |
|--------|-------------|
| A | Text area with {{variable}} syntax, separate mapping UI |
| B | Rich editor with "insert variable" button/dropdown |
| C | Template builder with drag-drop variables |

**Recommendation**: Option B - balance of power and usability.

**Decision**: _______________

---

### Q13: How to preview transform pipeline?

**Context**: Admin wants to test pipeline before publishing.

**Options**:

| Option | Description |
|--------|-------------|
| A | No preview - use preview mode session |
| B | "Test with sample data" button |
| C | Live preview as config changes |

**Recommendation**: Option A for MVP, consider B later.

**Decision**: _______________

---

### Q14: Node reordering constraints?

**Context**: Some node orders are invalid (e.g., composeGif before its inputs exist).

**Options**:

| Option | Description |
|--------|-------------|
| A | Allow any order, validate on save |
| B | Constrain drag-drop based on dependencies |
| C | Auto-reorder based on dependencies |

**Recommendation**: Option A - simpler, clear error messages.

**Decision**: _______________

---

## Data Model Questions

### Q15: How to handle step deletion when transform references it?

**Context**: Admin deletes a step that transform pipeline references.

**Options**:

| Option | Description |
|--------|-------------|
| A | Prevent deletion if referenced |
| B | Cascade delete references (break pipeline) |
| C | Soft-delete with warning |
| D | Show warning, require manual fix |

**Recommendation**: Option D - explicit user action required.

**Decision**: _______________

---

### Q16: Should transform step have position constraints?

**Context**: Transform step logically should be last (or near last) since it processes collected data.

**Options**:

| Option | Description |
|--------|-------------|
| A | No constraints - user can place anywhere |
| B | Must be last step in experience |
| C | Must be after all referenced steps |
| D | Warn if not last but allow |

**Recommendation**: Option C - enforce valid references.

**Decision**: _______________

---

## Future Considerations

### Q17: Multiple transform steps in one experience?

**Context**: Could an experience have multiple transform steps?

Example: Capture → Transform1 (remove bg) → More captures → Transform2 (create gif)

**Decision needed**: Allow or restrict to single transform step?

**Recommendation**: Allow but note complexity for MVP. Defer to post-MVP.

---

### Q18: Shareable pipeline templates?

**Context**: Admin might want to reuse pipeline configs across experiences.

**Options**:

| Option | Description |
|--------|-------------|
| A | Copy-paste config manually |
| B | Pipeline templates library |
| C | Import/export JSON |

**Recommendation**: Option C for MVP, consider B later.

---

### Q19: Pipeline versioning and rollback?

**Context**: What if admin breaks a pipeline?

**Options**:

| Option | Description |
|--------|-------------|
| A | No versioning - manual backup |
| B | Auto-version on publish |
| C | Full version history with rollback |

**Recommendation**: Option B - aligns with experience versioning.

---

## Summary: Priority Decisions for MVP

1. **Q1**: Transform config storage location
2. **Q2**: Draft vs published config handling
3. **Q4**: Node output referencing
4. **Q6**: Error message security
5. **Q9**: Retry strategy
6. **Q10**: Timeout limits
7. **Q11**: Validation approach
8. **Q16**: Transform step position constraints
