# Transform Pipeline - PRD Phases

## Overview

This document breaks down the Transform Pipeline feature into incremental phases for gradual implementation and testing. Each phase builds on the previous and delivers testable functionality.

**Related Documents**:
- [spec.md](./spec.md) - Technical specification
- [decisions.md](./decisions.md) - Architecture decisions
- [use-cases.md](./use-cases.md) - Use case examples
- [risks.md](./risks.md) - Risk analysis

---

## Phase Summary

| Phase | Name | Status | Dependencies |
|-------|------|--------|--------------|
| 1 | Foundation & Schema | Not Started | - |
| 2 | Backend Pipeline Infrastructure | Not Started | Phase 1 |
| 3 | Creator Config UI (Basic) | Not Started | Phase 1 |
| 4 | Runtime & Step Integration | Not Started | Phase 2, 3 |
| 5 | AI Image Node | Not Started | Phase 4 |
| 6 | Composite Node | Not Started | Phase 4 |
| 7 | Background Removal Node | Not Started | Phase 4 |
| 8 | Validation & Polish | Not Started | Phase 5, 6, 7 |

---

## Phase 1: Foundation & Schema

**Status**: Not Started

**Goal**: Establish data model changes to support transform pipeline.

### Scope

- Add `name` field to base step schema (all steps)
- Add `transform` field to experience config schema (nullable)
- Create job document schema
- Update session schema (add `jobId`, `jobStatus`)
- Add Firestore security rules for jobs collection

### References

- [spec.md - Section 2.0](./spec.md#20-step-schema-update-all-steps) - Step schema update
- [spec.md - Section 2.1](./spec.md#21-experience-config-schema-updated) - Experience config schema
- [spec.md - Section 2.2](./spec.md#22-transform-config-embedded-in-experience) - Transform config schema
- [spec.md - Section 2.3](./spec.md#23-job-schema) - Job schema
- [spec.md - Section 2.4](./spec.md#24-session-schema-updates) - Session updates
- [decisions.md - D23](./decisions.md#d23-transform-storage-location) - Embed in experience doc
- [decisions.md - D24](./decisions.md#d24-transform-schema-position) - Separate transform field

### Acceptance Criteria

- [ ] Steps have `name` field with auto-generation on creation
- [ ] Experience schema accepts `transform: null | TransformConfig`
- [ ] Existing experiences work unchanged (transform defaults to null)
- [ ] Job schema is defined and validated
- [ ] Session schema includes job tracking fields
- [ ] Security rules allow admin read on jobs, server-only write

---

## Phase 2: Backend Pipeline Infrastructure

**Status**: Not Started

**Goal**: Build execution backbone without actual node processing.

### Scope

- Create `startTransformPipeline` HTTP function
- Set up Cloud Task queue for `transformPipelineJob`
- Implement job document creation and status transitions
- Sync job status to session document
- Configure timeout (10 minutes)
- Implement error handling with sanitized client messages

### References

- [spec.md - Section 1.2](./spec.md#12-data-flow) - Data flow diagram
- [spec.md - Section 3.1](./spec.md#31-http-function-starttransformpipeline) - HTTP function spec
- [spec.md - Section 3.2](./spec.md#32-cloud-task-transformpipelinejob) - Cloud Task spec
- [decisions.md - D10](./decisions.md#d10-pipeline-execution-timeout) - 10 minute timeout
- [decisions.md - D6](./decisions.md#d6-error-message-security) - Sanitized errors
- [decisions.md - D9](./decisions.md#d9-ai-model-retry-strategy) - No retries

### Acceptance Criteria

- [ ] HTTP function accepts `sessionId`, `stepId` and returns `jobId`
- [ ] Job document created with status `pending`
- [ ] Cloud Task queued successfully
- [ ] Task handler updates job status to `running`
- [ ] Session document reflects job status changes
- [ ] Job transitions to `completed` (stub - no actual processing)
- [ ] Error states handled, client receives sanitized message
- [ ] 10 minute timeout configured

---

## Phase 3: Creator Config UI (Basic)

**Status**: Not Started

**Goal**: Enable admins to configure transform in experience editor.

### Scope

- Add Transform panel/tab to experience designer
- Node list UI (add, remove, reorder)
- Node type selector (AI Image, Composite, Background Removal, Background Swap)
- Variable mappings section (add, remove, edit)
- Basic node config editing (type-specific forms as placeholders)
- Save transform config to experience draft

### References

- [spec.md - Section 6.2](./spec.md#62-admin-config-panel) - Admin config panel
- [decisions.md - D12](./decisions.md#d12-dynamic-prompt-ui) - Rich editor with Insert Variable
- [decisions.md - D14](./decisions.md#d14-node-reordering-constraints) - Allow any order
- [decisions.md - D27](./decisions.md#d27-node-types-mvp) - MVP node types

### Acceptance Criteria

- [ ] Transform panel visible in experience designer
- [ ] Can add nodes of each type
- [ ] Can remove nodes
- [ ] Can reorder nodes (drag-drop)
- [ ] Can add/edit/remove variable mappings
- [ ] Transform config saves to experience.draft.transform
- [ ] UI shows node display names and icons (Cut Out, Combine, etc.)

---

## Phase 4: Runtime & Step Integration

**Status**: Not Started

**Goal**: Integrate transform step into existing experience runtime.

### Scope

- Create transform step renderer (`transform.pipeline` type)
- Virtual step injection in runtime (append transform as final step)
- Step renderer triggers `startTransformPipeline` on mount
- Loading state UI ("Creating your masterpiece...")
- Job status subscription via session sync
- Error state with "Start Over" button
- Completion detection and result handling

### References

- [spec.md - Section 1.3](./spec.md#13-runtime-adaptation) - Runtime adaptation
- [spec.md - Section 6.1](./spec.md#61-transform-step-renderer) - Transform step renderer
- [decisions.md - D7](./decisions.md#d7-guest-progress-visibility) - Generic loading state
- [decisions.md - D29](./decisions.md#d29-transform-error-ux) - Error UX

### Acceptance Criteria

- [ ] Transform appears as final step in runtime when configured
- [ ] Step renderer calls `startTransformPipeline` on entry
- [ ] Loading spinner shows during processing
- [ ] Generic loading message displays
- [ ] Error state shows friendly message + "Start Over"
- [ ] "Start Over" restarts experience (new session)
- [ ] On completion, result is available in session
- [ ] Can test full flow via ExperiencePreviewModal

---

## Phase 5: AI Image Node

**Status**: Not Started

**Goal**: Implement AI Image node - the hero transformation feature.

### Scope

- AI Image node executor in Cloud Function
- Gemini API integration (gemini-2.5-flash, gemini-2.5-pro)
- Prompt template variable resolution (`{{variable}}` syntax)
- Reference image handling
- Output storage to Firebase Storage
- AI Image node config panel in Creator UI
- Prompt template editor with "Insert Variable" button
- Model and aspect ratio selection
- Reference image picker

### References

- [spec.md - Section 2.2](./spec.md#22-transform-config-embedded-in-experience) - aiImageNodeSchema
- [spec.md - Section 5.2](./spec.md#52-variable-resolution) - Variable resolution
- [spec.md - Section 7](./spec.md#7-storage-paths) - Storage paths
- [use-cases.md - Use Case 3](./use-cases.md#use-case-3-hobbitify---full-ai-transform) - Hobbitify example
- [decisions.md - D12](./decisions.md#d12-dynamic-prompt-ui) - Rich prompt editor

### Acceptance Criteria

- [ ] AI Image node executes in pipeline
- [ ] Gemini API called with resolved prompt
- [ ] Variables in prompt template resolved from session data
- [ ] Reference images passed to API
- [ ] Output image stored in Firebase Storage
- [ ] Result URL written to job output
- [ ] Config panel allows prompt editing
- [ ] Can insert variables from mappings
- [ ] Model selection works
- [ ] Aspect ratio selection works
- [ ] End-to-end test: capture photo → AI transform → result

---

## Phase 6: Composite Node

**Status**: Not Started

**Goal**: Implement Composite node for layering multiple images.

### Scope

- Composite node executor in Cloud Function
- Layer configuration handling (source, zIndex, fit, opacity)
- Support layer sources: variable, node output, previousNode, asset
- Image compositing logic (Sharp or similar)
- Output format handling (auto-detect or forced)
- Composite node config panel in Creator UI
- Layer list management (add, remove, reorder)
- Layer source picker (variable, asset, node)
- Fit and opacity controls

### References

- [spec.md - Section 2.2](./spec.md#22-transform-config-embedded-in-experience) - compositeNodeSchema
- [decisions.md - D4](./decisions.md#d4-node-output-referencing) - Node references

### Acceptance Criteria

- [ ] Composite node executes in pipeline
- [ ] Multiple layers combined correctly by zIndex
- [ ] Layer fit modes work (cover, contain, stretch, none)
- [ ] Opacity applied correctly
- [ ] Can reference previous node output as layer
- [ ] Can reference specific node output by ID
- [ ] Can use static asset as layer
- [ ] Config panel allows layer management
- [ ] End-to-end test: AI output composited onto background

---

## Phase 7: Background Removal Node

**Status**: Not Started

**Goal**: Implement background removal and convenience Background Swap node.

### Scope

- Remove Background node executor (integrate removal API)
- Mode handling (keepSubject, keepBackground)
- PNG output with transparency
- Background Swap convenience node (combines removal + composite)
- Remove Background config panel
- Background Swap config panel with background source picker

### References

- [spec.md - Section 2.2](./spec.md#22-transform-config-embedded-in-experience) - removeBackgroundNodeSchema, backgroundSwapNodeSchema
- [decisions.md - D5](./decisions.md#d5-backgroundswap-dynamic-backgrounds) - Accept assets AND node outputs
- [use-cases.md - Use Case 1](./use-cases.md#use-case-1-simple-background-removal) - Simple background removal
- [use-cases.md - Use Case 4](./use-cases.md#use-case-4-hobbitify-modified---ai-generated-background) - AI-generated background

### Acceptance Criteria

- [ ] Remove Background node executes in pipeline
- [ ] Subject extracted with transparent background
- [ ] keepSubject and keepBackground modes work
- [ ] Background Swap combines removal + background
- [ ] Background Swap accepts static asset source
- [ ] Background Swap accepts node output source
- [ ] Config panels functional
- [ ] End-to-end test: remove bg → swap with AI-generated background

---

## Phase 8: Validation & Polish

**Status**: Not Started

**Goal**: Production hardening and edge case handling.

### Scope

- Strict publish-time validation
  - Step references exist and are before transform
  - Node references are valid
  - Required assets exist
  - Prompt variables have mappings
- Step deletion warnings (when referenced by transform)
- Variable default values handling
- Preview integration refinements
- Error edge cases
- Performance optimizations

### References

- [spec.md - Section 4](./spec.md#4-security-model) - Security model
- [decisions.md - D11](./decisions.md#d11-pipeline-validation-strategy) - Loose draft, strict publish
- [decisions.md - D15](./decisions.md#d15-step-deletion-with-references) - Warn + allow + fix before publish
- [decisions.md - D26](./decisions.md#d26-variable-defaults) - Default values
- [risks.md - R2](./risks.md#r2-step-reference-integrity) - Reference integrity

### Acceptance Criteria

- [ ] Publish fails with clear message if step references invalid
- [ ] Publish fails if node references invalid
- [ ] Publish fails if required assets missing
- [ ] Publish fails if prompt variables lack mappings
- [ ] Warning shown when deleting step referenced by transform
- [ ] Default values used when step data empty/missing
- [ ] Preview works reliably with all node types
- [ ] Error states handle all failure modes gracefully

---

## Notes

### Parallel Work Opportunities

- **Phase 3** (Creator UI) can start after Phase 1, parallel to Phase 2
- **Phases 5, 6, 7** (individual nodes) can be worked in parallel after Phase 4

### Future Phases (Post-MVP)

- AI Video node
- AI Text node
- GIF composition
- Video background
- Custom loading messages
- Pipeline templates
