# Implementation Plan: Lexical Prompt Editor with Mentions

**Branch**: `055-lexical-prompt-editor` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/055-lexical-prompt-editor/spec.md`

## Summary

Replace the plain textarea in AIImageNode's PromptComposer with a Lexical rich text editor that supports "@" mentions for experience steps and reference media. The existing Lexical implementation in `domains/ai-presets/lexical/` provides reusable nodes, plugins, and serialization utilities that can be adapted for the experience domain with minimal modification.

**Key technical approach:**
- Copy and adapt the existing `ai-presets/lexical/` infrastructure to `experience/generate/lexical/`
- Create new `StepMentionNode` adapted from `VariableMentionNode` (stores step name for both display and storage)
- Adapt existing `MediaMentionNode` (stores display name for both display and storage)
- Adapt `MentionsPlugin` to accept steps and media from experience context
- Implement serialization: `@{step:stepName}` and `@{ref:displayName}` format (human-readable names for debuggability)
- Replace `PromptInput` component with new `LexicalPromptInput`

**Storage format decision:**
- Uses human-readable names instead of IDs for debuggability in Firestore
- Trade-off: Step/media renames will invalidate existing references (validation plugin shows error state)
- See `future-session-schema-refactor.md` for backend resolution prerequisites

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Lexical 0.x (already installed), React 19, @lexical/react
**Storage**: Firestore (prompts stored in `experience.draft.transformNodes[].config.prompt`)
**Testing**: Vitest (existing test patterns)
**Target Platform**: Web (TanStack Start app), mobile-first
**Project Type**: Web application (monorepo with apps/clementine-app)
**Performance Goals**: Autocomplete <200ms, filter <100ms, mention insert <3s user flow
**Constraints**: Must serialize to plain text format compatible with existing storage
**Scale/Scope**: Single editor component, ~10 files to create/modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Autocomplete will have 44x44px touch targets, mobile-friendly positioning |
| II. Clean Code & Simplicity | ✅ PASS | Reusing existing patterns, no over-engineering |
| III. Type-Safe Development | ✅ PASS | Full TypeScript strict mode, Zod validation for step/media lookups |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on serialization unit tests (critical path) |
| V. Validation Gates | ✅ PASS | Will run format, lint, type-check before completion |
| VI. Frontend Architecture | ✅ PASS | Client-side Lexical editor, Firebase client SDK for data |
| VII. Backend & Firebase | N/A | No backend changes required |
| VIII. Project Structure | ✅ PASS | Vertical slice in `experience/generate/lexical/` |

**Standards to verify before completion:**
- `frontend/design-system.md` - Use theme tokens for mention pill colors
- `frontend/component-libraries.md` - Build on existing Lexical patterns
- `frontend/accessibility.md` - Keyboard navigation, ARIA labels on autocomplete
- `global/code-quality.md` - Validation workflow

## Project Structure

### Documentation (this feature)

```text
specs/055-lexical-prompt-editor/
├── spec.md                            # Feature specification
├── plan.md                            # This file
├── research.md                        # Phase 0 research output
├── data-model.md                      # Phase 1 data model
├── quickstart.md                      # Phase 1 quickstart guide
├── contracts/                         # Phase 1 contracts (N/A - no new APIs)
├── future-session-schema-refactor.md  # PRD for follow-up session schema changes
└── tasks.md                           # Phase 2 tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/experience/generate/
├── components/
│   └── PromptComposer/
│       ├── index.ts                    # Barrel export
│       ├── PromptComposer.tsx          # Container (UPDATE: pass steps/media)
│       ├── LexicalPromptInput.tsx      # NEW: Lexical editor component
│       ├── ControlRow.tsx              # Existing (no changes)
│       ├── ReferenceMediaStrip.tsx     # Existing (no changes)
│       └── AddMediaButton.tsx          # Existing (no changes)
└── lexical/                            # NEW: Domain-specific Lexical infrastructure
    ├── index.ts                        # Barrel export
    ├── nodes/
    │   ├── index.ts                    # Node exports
    │   ├── StepMentionNode.tsx         # NEW: Step mention (blue pill)
    │   └── MediaMentionNode.tsx        # COPY: From ai-presets (green pill)
    ├── plugins/
    │   ├── index.ts                    # Plugin exports
    │   ├── MentionsPlugin.tsx          # ADAPT: Accept steps + refMedia
    │   ├── SmartPastePlugin.tsx        # COPY: From ai-presets
    │   └── MentionValidationPlugin.tsx # ADAPT: Validate steps + media
    └── utils/
        ├── index.ts                    # Utility exports
        ├── types.ts                    # Option types for steps/media
        └── serialization.ts            # Serialize/deserialize @{step:name} format
```

**Structure Decision**: Vertical slice within `experience/generate/` domain. The lexical infrastructure is copied (not shared) to allow domain-specific customization without affecting the deprecated ai-presets domain. This follows the "feature encapsulation" principle from project-structure.md.

## Complexity Tracking

No constitution violations. The implementation reuses existing patterns and maintains simplicity.
