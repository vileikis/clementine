# Tasks: Lexical Mention Node UX Improvements

**Input**: Design documents from `/specs/089-mention-node-ux/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: No tests explicitly requested in the feature specification. Manual testing via quickstart.md.

**Organization**: Tasks are grouped by user story. US1 and US2 share the same implementation (identical root cause fix) and are combined into a single phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All source files are under:
`apps/clementine-app/src/domains/experience/create/`

---

## Phase 1: User Stories 1 & 2 - Cursor Navigation Fix (Priority: P1) 🎯 MVP

**Goal**: Fix cursor hijacking bugs so users can reliably click and arrow-key navigate around mention nodes — both when isolated on a line and inline with text.

**Independent Test**: Insert a mention node on an empty line and verify cursor placement via mouse click before/after it and arrow key navigation. Then insert a mention between text and verify cursor traversal with arrow keys.

### Implementation for User Stories 1 & 2

- [x] T001 [P] [US1] Remove `contenteditable="false"` attribute and `user-select: none` CSS from `createDOM()` in `lexical/nodes/StepMentionNode.tsx`; add `position: relative` to inline styles
- [x] T002 [P] [US2] Remove `contenteditable="false"` attribute and `user-select: none` CSS from `createDOM()` in `lexical/nodes/MediaMentionNode.tsx`; add `position: relative` to inline styles
- [ ] T003 [US1] Manually verify cursor navigation for isolated mention nodes: click before/after, arrow key up/down/left/right traversal, both StepMention and MediaMention types per quickstart.md test scenarios
- [ ] T004 [US2] Manually verify cursor navigation for inline mention nodes: click at left/right boundary, arrow key left/right traversal past mention, both node types per quickstart.md test scenarios

**Checkpoint**: Cursor navigation works reliably for both isolated and inline mention nodes. US1 and US2 acceptance scenarios all pass.

---

## Phase 2: User Story 3 - Delete Mention Node via Mouse (Priority: P2)

**Goal**: Add a hover-activated close icon to mention nodes so users can delete them with a single mouse click, without layout shift.

**Independent Test**: Hover over any mention node — close icon appears at the start. Move mouse away — icon disappears. Click the icon — mention is removed from editor content. Verify in disabled mode no icon appears.

### Implementation for User Story 3

- [x] T005 [US3] Create `MentionDeletePlugin.tsx` in `lexical/plugins/MentionDeletePlugin.tsx`: implement plugin using `useLexicalComposerContext`, inject `<style>` for `.mention-delete-btn` hover rules, register mutation listeners for both `StepMentionNode` and `MediaMentionNode`, inject absolutely-positioned delete button on node creation, attach `mousedown`+`click` handlers with `preventDefault`/`stopPropagation` that call `editor.update(() => $getNodeByKey(key)?.remove())`, check `editor.isEditable()` before injection
- [x] T006 [US3] Add barrel export `export * from './MentionDeletePlugin'` to `lexical/plugins/index.ts`
- [x] T007 [US3] Register `<MentionDeletePlugin />` in the plugin stack in `components/PromptComposer/LexicalPromptInput.tsx`, passing `disabled` prop
- [ ] T008 [US3] Manually verify hover delete: hover shows icon, mouseout hides icon, click removes node, disabled state suppresses icon, both valid and invalid mention states, both StepMention and MediaMention types per quickstart.md test scenarios

**Checkpoint**: Hover delete works for all mention types and states. US3 acceptance scenarios all pass.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression checks, and cleanup

- [ ] T009 Verify serialization round-trip is unchanged: insert mentions, serialize, deserialize, confirm output matches — in `lexical/utils/serialization.ts` (no code changes expected, verification only)
- [x] T010 Run validation gates: `pnpm app:type-check` + `pnpm app:lint` + `pnpm app:format` from monorepo root
- [ ] T011 Verify edge cases: adjacent mentions (cursor between them, independent close icons), delete last mention on a line (empty paragraph remains), delete during active selection (selection cleared, node removed)
- [ ] T012 Standards compliance review: verify against `standards/frontend/design-system.md` and `standards/frontend/component-libraries.md` per constitution Principle V

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1+US2 Cursor Fix)**: No dependencies — can start immediately
- **Phase 2 (US3 Hover Delete)**: Depends on T001 and T002 completion (needs `position: relative` on mention nodes)
- **Phase 3 (Polish)**: Depends on Phase 1 and Phase 2 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies — standalone cursor fix for isolated nodes
- **User Story 2 (P1)**: No dependencies — standalone cursor fix for inline nodes (same implementation as US1, different verification)
- **User Story 3 (P2)**: Depends on US1/US2 completion (the `position: relative` style added in T001/T002 is required for the delete button's absolute positioning)

### Within Each Phase

- T001 and T002 can run in parallel (different files)
- T003 depends on T001+T002 completion
- T004 depends on T001+T002 completion
- T005 must complete before T006 and T007
- T006 and T007 can run in parallel after T005
- T008 depends on T005+T006+T007 completion

### Parallel Opportunities

- T001 + T002 can run in parallel (different node files, identical change pattern)

---

## Parallel Example: Phase 1

```bash
# Launch both node fixes in parallel (different files):
Task T001: "Fix StepMentionNode.tsx createDOM in lexical/nodes/StepMentionNode.tsx"
Task T002: "Fix MediaMentionNode.tsx createDOM in lexical/nodes/MediaMentionNode.tsx"

# After both complete, verify sequentially:
Task T003: "Verify isolated mention cursor navigation"
Task T004: "Verify inline mention cursor navigation"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Cursor Navigation Fix (T001–T004)
2. **STOP and VALIDATE**: Test both isolated and inline cursor navigation
3. Deploy/demo if ready — this alone resolves the critical cursor hijacking bugs

### Incremental Delivery

1. Phase 1 (US1+US2) → Cursor fix deployed → Critical bugs resolved (MVP!)
2. Phase 2 (US3) → Hover delete added → UX enhancement delivered
3. Phase 3 (Polish) → Validation gates pass → Standards compliant → Ready for PR

---

## Notes

- T001 and T002 are the only code changes needed for the cursor fix (US1+US2). The fix is minimal: remove 2 lines, modify 1 line in each file.
- T005 is the largest task — a new plugin file (~80–100 lines). All other tasks are small modifications or verifications.
- No new dependencies are needed. All Lexical APIs used (`registerMutationListener`, `$getNodeByKey`, `node.remove()`) are stable in the installed `^0.39.0` version.
- Serialization is unaffected — the changes are purely DOM-level (attributes and CSS). The Lexical state model, JSON serialization, and plain text serialization remain identical.
