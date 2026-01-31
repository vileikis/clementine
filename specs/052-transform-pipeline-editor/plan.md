# Implementation Plan: Transform Pipeline Editor

**Branch**: `052-transform-pipeline-editor` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/052-transform-pipeline-editor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build the foundational UI for managing AI Image nodes in the transform pipeline editor. This phase (1b-2 from the Inline Prompt Architecture plan) delivers CRUD operations for transform nodes, basic node display cards, a node editor panel structure, and auto-save functionality. The implementation creates a dedicated domain at `domains/experience/generate` separate from the experience designer, enabling experience creators to configure AI-powered image generation transformations.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Zustand 5.x, Zod 4.1.12, Firebase SDK 12.5.0, shadcn/ui + Radix UI, Tailwind CSS v4
**Storage**: Firebase Firestore (client SDK - `experience.draft.transform` field)
**Testing**: Vitest (unit tests for resolution/validation logic - Phase 1f), Testing Library (component tests - Phase 1h)
**Target Platform**: Web (TanStack Start full-stack React application)
**Project Type**: Web application (monorepo structure with vertical slice architecture)
**Performance Goals**: Auto-save debounce 2000ms, UI interactions <100ms, real-time Firestore sync
**Constraints**: Mobile-first design (320px-768px primary viewport), 44x44px minimum touch targets, client-first architecture (Firebase client SDK for data operations)
**Scale/Scope**: Single feature domain (`domains/experience/generate`), ~10 components, ~5 hooks, foundational phase (no Lexical editor yet - Phase 1d)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mobile-First Design ✅

- **Primary viewport**: 320px-768px (mobile and tablet)
- **Touch targets**: All buttons (Add Node, Delete, Close) will be 44x44px minimum
- **Testing plan**: Test on real mobile devices before completion
- **Compliance**: Feature is mobile-first UI - node cards, editor panel designed for touch

### II. Clean Code & Simplicity ✅

- **YAGNI**: Implementing only Phase 1b-2 scope (CRUD, display, placeholder editor)
- **Single Responsibility**: Each component has one purpose (NodeCard = display, AddNodeButton = create)
- **Function size**: Target ~30 lines maximum
- **No dead code**: No commented code - use git history
- **DRY**: Extract common logic only when duplication becomes problematic

### III. Type-Safe Development ✅

- **TypeScript strict mode**: Enabled (tsconfig.json confirms)
- **No implicit any**: All types explicitly defined
- **Strict null checks**: Handle null/undefined explicitly
- **Runtime validation**: Zod schemas from `@clementine/shared` for transform config
- **Server-side validation**: N/A (client-only feature with Firestore rules)

### IV. Minimal Testing Strategy ✅

- **Unit tests**: Only for critical resolution/validation logic (Phase 1f - future)
- **Test behavior**: Test node CRUD operations, auto-save behavior
- **Focus areas**: Auto-save debounce, node ID generation, delete confirmation
- **Coverage goal**: 70%+ overall, focus on hooks (useAddNode, useDeleteNode, useUpdateTransformConfig)
- **E2E**: Deferred to Phase 1h

### V. Validation Gates ✅

**Technical Validation:**
- Before every commit: `pnpm app:check` (format + lint + auto-fix)
- Type-check: `pnpm app:type-check`
- Local dev verification: `pnpm app:dev`

**Standards Compliance:**
- **Frontend work** → Review `frontend/design-system.md` + `frontend/component-libraries.md`
- **Project structure** → Review `global/project-structure.md`
- **Code quality** → Review `global/code-quality.md`
- **Security** → Review `global/security.md`

### VI. Frontend Architecture ✅

- **Client-first pattern**: Using Firebase client SDK for Firestore operations (90% of code)
- **SSR strategy**: N/A for this feature (client-side only)
- **Security enforcement**: Firestore rules will enforce experience draft access
- **Real-time**: Using `onSnapshot` for experience draft updates (if needed)
- **TanStack Query**: For data fetching and caching

### VII. Backend & Firebase ✅

- **Client SDK**: All reads/writes to `experience.draft.transform` use client SDK
- **Admin SDK**: Not needed for this phase
- **Security rules**: Experience draft write access enforced by Firestore rules
- **Public URLs**: N/A (no media in this phase - Phase 1c handles refMedia)

### VIII. Project Structure ✅

- **Vertical slice**: New domain `domains/experience/generate` (separate from designer)
- **Technical grouping**: `components/`, `containers/`, `hooks/`, `stores/`
- **File naming**: `[domain].[purpose].[ext]` pattern (e.g., `TransformPipelineEditor.tsx`, `useAddNode.ts`)
- **Barrel exports**: Every folder has `index.ts` re-exporting contents
- **Restricted API**: Export only components, hooks, types (not stores, actions)

### Complexity Tracking

**No violations identified.** This feature follows all constitution principles:
- Simple CRUD operations (no premature abstraction)
- Client-first Firebase usage
- Standard vertical slice architecture
- Mobile-first UI with shadcn/ui components

## Project Structure

### Documentation (this feature)

```text
specs/052-transform-pipeline-editor/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/experience/generate/
├── components/
│   ├── NodeList.tsx                      # List/canvas view of AI Image nodes
│   ├── AIImageNodeCard.tsx               # Node card with summary (model, aspect ratio, prompt preview)
│   ├── AddNodeButton.tsx                 # "Add Node" button
│   ├── DeleteNodeDialog.tsx              # Delete confirmation dialog
│   ├── NodeEditorPanel.tsx               # Sidebar panel for node editing
│   ├── EmptyState.tsx                    # Empty state with "Add Node" button
│   └── index.ts                          # Barrel export
├── containers/
│   ├── TransformPipelineEditor.tsx       # Main editor container
│   └── index.ts                          # Barrel export
├── hooks/
│   ├── useUpdateTransformConfig.ts       # Auto-save transform config to draft
│   ├── useAddNode.ts                     # Add new AI Image node
│   ├── useDeleteNode.ts                  # Delete node with confirmation
│   ├── useSelectedNode.ts                # Track selected node for editor panel
│   └── index.ts                          # Barrel export
└── index.ts                              # Domain public API (export components, hooks only)

packages/shared/src/schemas/experience/
├── nodes/
│   ├── ai-image-node.schema.ts           # Already exists (Phase 1a complete)
│   └── ref-media-entry.schema.ts         # Already exists (Phase 1a complete)
└── transform.schema.ts                   # Already exists (Phase 1a complete)
```

**Structure Decision**: Web application (monorepo). This feature lives in the `domains/experience/generate` domain within the `apps/clementine-app` workspace. The domain is **separate** from `domains/experience/designer` to maintain clear separation of concerns. Schemas are already defined in `packages/shared` from Phase 1a.

---

## Phase 0: Outline & Research ✅ COMPLETE

**Objective**: Resolve all NEEDS CLARIFICATION items from Technical Context and research existing patterns.

**Research Tasks Completed**:

1. ✅ **AI Image Node Schemas Analysis**
   - Verified Phase 1a schemas are complete and comprehensive
   - Documented structure of `aiImageNodeConfigSchema`, `transformConfigSchema`, `mediaReferenceSchema`
   - Identified validation rules and constraints
   - **Output**: research.md Section 1

2. ✅ **Auto-Save Pattern Research**
   - Found shared `useAutoSave` hook with 2000ms debounce
   - Found `useUpdateExperienceDraft` hook with transaction pattern
   - Found `updateExperienceConfigField` helper for nested updates
   - Found `useTrackedMutation` for save status tracking
   - **Output**: research.md Section 2

3. ✅ **Save Status Indicator Research**
   - Found `EditorSaveStatus` component (shared)
   - Found `createEditorStore` for tracking pending saves
   - Documented spinner → checkmark pattern
   - **Output**: research.md Section 3

4. ✅ **Delete Confirmation Pattern Research**
   - Found `AlertDialog` pattern for destructive actions
   - Found delete mutation hooks in workspace and AI presets domains
   - Documented controlled state management pattern
   - **Output**: research.md Section 4

5. ✅ **UI Component Library Usage**
   - Confirmed shadcn/ui + Radix UI as standard
   - Identified components to use: Button, Card, Sheet, Badge, AlertDialog
   - **Output**: research.md Section 5

6. ✅ **Additional Decisions**
   - Node ID generation: Use `nanoid` (consistent with codebase)
   - Mobile-first requirements: 44px touch targets, responsive design
   - State management: Zustand store for selected node
   - Testing approach: Defer comprehensive testing to Phase 1h
   - **Output**: research.md Sections 6-9

**Artifacts Created**:
- ✅ `research.md` - Complete research findings with decisions and alternatives

**No Remaining Unknowns**: All research complete. Ready for Phase 1.

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Objective**: Generate data model, API contracts, and quickstart guide.

**Design Tasks Completed**:

1. ✅ **Data Model Generation**
   - Entity relationship diagram (TransformConfig → TransformNode → AIImageNodeConfig)
   - Core entity definitions with fields, types, relationships
   - UI state entities (GenerateEditorState in Zustand)
   - Data flow documentation (create, delete, auto-save)
   - Firestore structure and update operations
   - Default values and constraints
   - **Output**: data-model.md

2. ✅ **API Contract Generation**
   - Firestore update contract (add node, delete node, update node)
   - Transaction requirements (atomicity, optimistic locking)
   - Data type definitions (complete TypeScript interfaces)
   - Validation requirements (Zod schemas, Firestore rules)
   - Optimistic locking mechanism (draftVersion)
   - Cache invalidation strategy (TanStack Query)
   - Error handling patterns
   - **Output**: contracts/firestore-updates.md

3. ✅ **Quickstart Guide Generation**
   - Step-by-step implementation instructions
   - Code examples for all components, hooks, containers
   - Usage examples and testing guidance
   - Troubleshooting section
   - Next steps (Phase 1c-1h)
   - **Output**: quickstart.md

4. ✅ **Agent Context Update**
   - Added TypeScript 5.7.2 to CLAUDE.md
   - Added React 19, TanStack ecosystem, Zustand, Firebase to CLAUDE.md
   - Preserved manual additions between markers
   - **Output**: Updated /CLAUDE.md

**Artifacts Created**:
- ✅ `data-model.md` - Complete entity model with relationships and constraints
- ✅ `contracts/firestore-updates.md` - Firestore update contract specification
- ✅ `quickstart.md` - Implementation guide with code examples
- ✅ Updated `CLAUDE.md` - Agent context with new technology stack

**Design Complete**: All Phase 1 artifacts generated. Ready for Phase 2 (Tasks).

---

## Constitution Check (Post-Design Re-Evaluation)

**Re-checking after design phase**:

### All Gates Still Pass ✅

- **Mobile-First**: UI components designed with 44px touch targets, responsive layouts
- **Clean Code**: Simple CRUD operations, no premature abstraction
- **Type-Safe**: All types defined, Zod validation enforced
- **Testing**: Deferred to Phase 1h (appropriate for this phase)
- **Validation**: Plan includes format/lint/type-check before commit
- **Frontend Architecture**: Client-first Firebase usage confirmed
- **Backend**: Client SDK only (no Admin SDK needed)
- **Project Structure**: Vertical slice architecture in `domains/experience/generate`

**No New Violations**: Design maintains compliance with all constitution principles.

---

## Next Steps

**Phase 2**: Generate tasks.md using `/speckit.tasks` command

This command will:
1. Read plan.md, data-model.md, quickstart.md, contracts/
2. Generate dependency-ordered tasks
3. Create actionable task list in tasks.md

**Command**: `/speckit.tasks`

---

## Summary

**Phase 0-1 Planning Complete**:
- ✅ Research complete (no unknowns remaining)
- ✅ Data model defined (entities, relationships, constraints)
- ✅ Contracts specified (Firestore updates, validation, error handling)
- ✅ Quickstart guide created (implementation instructions)
- ✅ Agent context updated (CLAUDE.md)
- ✅ Constitution check passed (all gates green)

**Ready for**: Task generation (Phase 2) and implementation

**Branch**: `052-transform-pipeline-editor`
**Estimated Implementation Time**: 2-3 days (per parent plan Phase 1b-2)

---

**Planning completed successfully. Use `/speckit.tasks` to generate implementation tasks.**
