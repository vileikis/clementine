# Implementation Plan: AI Preset Editor - Preview Panel

**Branch**: `045-ai-preset-preview` | **Date**: 2025-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/045-ai-preset-preview/spec.md`

## Summary

Build the preview panel (right side) of the AI Preset Editor to enable preset creators to test variable inputs, view live prompt resolution, see media preview grids, get validation feedback, and access a placeholder test generation button. This is a **client-side only** feature with no backend changes, focusing on enhancing the existing Phase 3 editor with real-time preview capabilities.

**Primary Requirement**: Enable preset creators to validate their AI preset configurations by testing different variable values and seeing the fully resolved prompt before using presets in production.

**Technical Approach**:
- Add new tab ("Preview") to existing left panel layout
- Build dynamic test input form based on preset variables (text dropdowns/inputs, image upload zones)
- Implement prompt resolution logic (parse `@{type:name}` references, substitute values, handle value mappings)
- Create media preview grid showing referenced registry + test upload images
- Add validation display with error/warning states
- Include UI-only placeholder test generation button for Phase 5

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**:
- React 19.2.0
- TanStack Start 1.132.0 (full-stack framework)
- TanStack Router 1.132.0 (file-based routing)
- TanStack Query 5.66.5 (data fetching/caching)
- Lexical (rich text editor framework - already integrated in Phase 3)
- Zustand 5.x (minimal state for save status tracking)
- Zod 4.1.12 (runtime validation)
- shadcn/ui + Radix UI (component library)
- Tailwind CSS v4 (styling)

**Storage**:
- Firestore: Read-only access to preset configuration data (`/workspaces/{workspaceId}/aiPresets/{presetId}`)
- Firebase Storage: Test image uploads (same infrastructure as Phase 3 media uploads)
- Local component state: Test input values (NOT persisted - temporary testing only)

**Testing**: Vitest (unit tests for resolution logic, component tests for preview panel)

**Target Platform**: Web (desktop + mobile responsive)

**Project Type**: Web application (TanStack Start monolithic app in `apps/clementine-app/`)

**Performance Goals**:
- Prompt resolution debounced to 300ms after input change
- Test image upload appears in media preview within 2 seconds
- Preview panel handles up to 20 variables + 10 media items without lag
- First render of preview panel < 500ms

**Constraints**:
- No backend changes (Cloud Functions, Firestore schema)
- No persistence of test input values (component state only)
- Must work with existing Phase 3 Lexical editor and reference format
- Must integrate seamlessly into existing two-column editor layout
- Test generation button is UI-only (Phase 5 will add functionality)

**Scale/Scope**:
- Single-feature enhancement to existing editor
- ~5-7 new React components
- ~3-4 custom hooks (resolution logic, validation logic, test input state)
- ~500-800 lines of new code (excluding tests)
- No new routes or pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Mobile-First Design
**Status**: PASS
- Preview panel will be responsive (stacks below config panel on mobile)
- Touch-friendly interactions (large upload zones, dropdown targets ≥44px)
- Performance targets align with mobile constraints (300ms debounce, lazy loading)

### ✅ II. Clean Code & Simplicity
**Status**: PASS
- Single-purpose components (TestInputsForm, PromptPreview, MediaPreviewGrid, ValidationDisplay)
- Resolution logic extracted to dedicated hook (`usePromptResolution`)
- No premature abstractions (value mapping logic is straightforward lookups)
- Debouncing via standard React patterns (useMemo with dependencies)

### ✅ III. Type-Safe Development
**Status**: PASS
- TypeScript strict mode enabled
- Zod schemas for test input validation
- Runtime validation for uploaded images (file type, size)
- No `any` types (all state explicitly typed)

### ✅ IV. Minimal Testing Strategy
**Status**: PASS
- Focus on critical resolution logic (text substitution, value mappings)
- Component tests for validation display (error/warning states)
- Mock preset data for isolated testing
- E2E deferred to Phase 5 (when test generation is functional)

### ✅ V. Validation Gates
**Status**: PASS
- Code will pass `pnpm app:check` (format, lint, type-check)
- Standards compliance review will cover:
  - `frontend/design-system.md` (theme tokens, no hard-coded colors)
  - `frontend/component-libraries.md` (shadcn/ui patterns)
  - `global/project-structure.md` (vertical slice architecture in domains/ai-presets/)
  - `frontend/state-management.md` (TanStack Query + local state patterns)
  - `frontend/performance.md` (debouncing, lazy loading, memoization)

### ✅ VI. Frontend Architecture
**Status**: PASS
- Client-first pattern (Firebase client SDK for Firestore reads)
- No SSR requirements (preview panel is authenticated editor UI)
- TanStack Query for preset data caching
- Local component state for test inputs (no persistence needed)

### ✅ VII. Backend & Firebase
**Status**: PASS (N/A)
- No backend changes required
- Read-only Firestore access (existing security rules sufficient)
- No Admin SDK usage

### ✅ VIII. Project Structure
**Status**: PASS
- New vertical slice: `domains/ai-presets/preview/` (separate from editor)
- Clear separation of concerns (editor = config, preview = testing)
- Components in `preview/components/` directory
- Hooks in `preview/hooks/` directory
- Tests colocated with source files
- Follows barrel export pattern via `index.ts`

**Overall Gate Result**: ✅ ALL GATES PASS - No violations to justify

## Project Structure

### Documentation (this feature)

```text
specs/045-ai-preset-preview/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (state entities)
├── quickstart.md        # Phase 1 output (dev setup)
└── contracts/           # Phase 1 output (empty - no API contracts)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/ai-presets/
│   ├── editor/                             # EXISTING: Phase 3 (Configuration)
│   │   ├── components/
│   │   │   ├── MediaRegistrySection.tsx
│   │   │   ├── PromptTemplateEditor.tsx
│   │   │   └── VariablesSection.tsx
│   │   ├── containers/
│   │   │   └── AIPresetEditorContent.tsx  # MODIFY: Add Preview tab
│   │   ├── hooks/
│   │   │   ├── useUpdateVariables.ts
│   │   │   └── useUpdateMediaRegistry.ts
│   │   └── lib/
│   │       └── updateAIPresetDraft.ts
│   │
│   ├── preview/                            # NEW: Phase 4 (Testing/Preview)
│   │   ├── components/
│   │   │   ├── AIPresetPreviewPanel.tsx   # Container component
│   │   │   ├── TestInputsForm.tsx         # Dynamic input form (P1)
│   │   │   ├── PromptPreview.tsx          # Resolved prompt display (P2)
│   │   │   ├── MediaPreviewGrid.tsx       # Media thumbnails (P3)
│   │   │   ├── ValidationDisplay.tsx      # Errors/warnings (P4)
│   │   │   └── TestGenerationButton.tsx   # Placeholder button (P5)
│   │   ├── hooks/
│   │   │   ├── useTestInputs.ts           # Test input state management
│   │   │   ├── useTestInputs.test.ts      # Colocated test
│   │   │   ├── usePromptResolution.ts     # Resolution logic hook
│   │   │   ├── usePromptResolution.test.ts # Colocated test
│   │   │   ├── usePresetValidation.ts     # Validation logic hook
│   │   │   └── usePresetValidation.test.ts # Colocated test
│   │   └── lib/
│   │       ├── prompt-resolution.ts       # Resolution utilities
│   │       └── prompt-resolution.test.ts  # Colocated test
│   │
│   ├── lexical/                            # EXISTING: Shared Lexical infrastructure
│   ├── queries/                            # EXISTING: Shared TanStack Query hooks
│   │   └── useAIPreset.ts                 # Used by both editor and preview
│   └── schemas/                            # EXISTING: Shared types/schemas
│
└── shared/
    ├── media/
    │   └── components/
    │       └── MediaPickerField.tsx        # EXISTING: Reuse for test uploads
    └── editor-status/                      # EXISTING: Save status tracking
```

**Structure Decision**: We're creating a new vertical slice `domains/ai-presets/preview/` separate from the existing `editor/` domain. This provides clear separation of concerns:
- `editor/` = Build preset configuration (Phase 3)
- `preview/` = Test presets with sample inputs (Phase 4)

This architecture:
- **Reduces nesting**: Flatter structure for better navigation
- **Separates concerns**: Configuration vs. testing are distinct activities
- **Future-proof**: Phase 5 test generation naturally fits in preview/ domain
- **Follows vertical slice principle**: Each subdomain is self-contained with its own components, hooks, and utilities
- **Colocates tests**: Test files live alongside source files (e.g., `usePromptResolution.test.ts` next to `usePromptResolution.ts`)

The existing editor container (`AIPresetEditorContent.tsx`) will be modified to add a "Preview" tab that renders the new `AIPresetPreviewPanel` component from the preview domain.

## Complexity Tracking

> **No complexity violations** - All constitution gates pass without justification needed.

## Phase 0: Research & Technical Decisions

See [research.md](./research.md) for detailed research findings.

### Key Decisions

1. **Reference Parsing Strategy**
   - **Decision**: Use regex-based parsing with pattern `/@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g`
   - **Rationale**: Phase 3 already established this format for serialization. Reusing the same regex ensures consistency.
   - **Alternatives Considered**: AST-based parsing (rejected - overkill for simple pattern), String.replace loops (rejected - less maintainable)

2. **State Management Pattern**
   - **Decision**: Local component state (useState) for test inputs, no Zustand store expansion
   - **Rationale**: Test inputs are temporary and non-persistent. Adding to Zustand would pollute the store with ephemeral data.
   - **Alternatives Considered**: Zustand global state (rejected - unnecessary persistence), URL query params (rejected - not RESTful for editor state)

3. **Debouncing Approach**
   - **Decision**: useMemo with dependency array for resolution, lodash.debounce not needed
   - **Rationale**: React's built-in useMemo provides automatic debouncing when dependencies don't change. Simpler than external debounce library.
   - **Alternatives Considered**: lodash.debounce (rejected - adds dependency), useEffect + setTimeout (rejected - more boilerplate)

4. **Media Preview Data Source**
   - **Decision**: Compute media list from prompt references on-the-fly (derived state)
   - **Rationale**: Media list is always derivable from prompt + test inputs. Storing separately creates sync issues.
   - **Alternatives Considered**: Separate media state (rejected - risk of stale data), Parsing media from Lexical editor state (rejected - wrong layer)

5. **Validation Timing**
   - **Decision**: Real-time validation on every input change (computed in useMemo)
   - **Rationale**: Users expect immediate feedback. Validation is lightweight (simple lookups).
   - **Alternatives Considered**: On-blur validation (rejected - delayed feedback), Manual "Validate" button (rejected - extra step)

6. **Image Upload Pattern**
   - **Decision**: Reuse existing MediaPickerField component from Phase 3
   - **Rationale**: Consistent UX, tested code, handles Firebase Storage integration.
   - **Alternatives Considered**: Custom upload component (rejected - unnecessary duplication)

## Phase 1: Data Model & Contracts

See [data-model.md](./data-model.md) for complete data model.

### Core Entities

1. **TestInputState**
   - Purpose: Holds temporary test input values for variables
   - Lifecycle: Created on mount, cleared on unmount
   - Storage: Component state (useState)
   - Shape:
     ```typescript
     {
       [variableName: string]: string | File | null
     }
     ```

2. **ResolvedPrompt**
   - Purpose: Fully substituted prompt text ready for display
   - Lifecycle: Computed on-the-fly (useMemo)
   - Storage: Derived state (not persisted)
   - Shape:
     ```typescript
     {
       text: string,              // Resolved prompt with substitutions
       characterCount: number,    // Length of resolved text
       hasUnresolved: boolean     // Any references failed to resolve?
     }
     ```

3. **MediaReferenceList**
   - Purpose: Collection of images to be sent to AI
   - Lifecycle: Computed on-the-fly (useMemo)
   - Storage: Derived state (not persisted)
   - Shape:
     ```typescript
     Array<{
       name: string,              // Reference name (for @mention)
       url: string,               // Thumbnail URL
       source: 'registry' | 'test', // Origin of image
       type: 'ref' | 'input'      // Mention type
     }>
     ```

4. **ValidationState**
   - Purpose: Tracks errors and warnings for display
   - Lifecycle: Computed on-the-fly (useMemo)
   - Storage: Derived state (not persisted)
   - Shape:
     ```typescript
     {
       status: 'valid' | 'invalid' | 'incomplete',
       errors: Array<{ field: string, message: string }>,
       warnings: Array<{ type: 'undefined-variable' | 'undefined-media' | 'unmapped-value', message: string }>
     }
     ```

### API Contracts

**No new API endpoints** - This is a client-side only feature. Preview panel reads existing Firestore data and operates entirely in the browser.

## Phase 1: Quickstart Guide

See [quickstart.md](./quickstart.md) for complete development setup.

### Quick Setup

```bash
# 1. Switch to feature branch
git checkout 045-ai-preset-preview

# 2. Install dependencies (if needed)
pnpm install

# 3. Start dev server
pnpm app:dev

# 4. Navigate to AI Preset Editor
# http://localhost:3000/workspace/{workspaceSlug}/ai-presets/{presetId}

# 5. Click "Preview" tab to see new preview panel

# 6. Run tests
pnpm app:test domains/ai-presets/editor

# 7. Run validation before commit
pnpm app:check
```

### Key Files to Understand

1. **AIPresetEditorContent.tsx** - Container with Edit/Preview tabs
2. **AIPresetPreviewPanel.tsx** - Main preview panel component
3. **usePromptResolution.ts** - Core resolution logic hook
4. **prompt-resolution.ts** - Utility functions for parsing and substitution

### Testing Preview Panel

1. Create or edit an AI preset
2. Add variables (text with value mappings, text without, image variables)
3. Add media to registry
4. Reference variables and media in prompt template using `@{type:name}` syntax
5. Switch to "Preview" tab
6. Fill in test input values
7. Observe resolved prompt updates in real-time
8. Check media preview grid shows referenced images
9. Verify validation display highlights any issues

## Implementation Phases

### Phase 0: Research ✅ (Complete)
- Analyzed existing Phase 3 implementation
- Documented Lexical integration patterns
- Identified reusable components (MediaPickerField)
- Confirmed reference format (`@{type:name}`)
- Validated state management approach (local state + derived state)

### Phase 1: Design ✅ (Complete)
- Defined core entities (TestInputState, ResolvedPrompt, MediaReferenceList, ValidationState)
- Documented data flow (test inputs → resolution → validation → UI)
- Created quickstart guide for development
- No API contracts (client-side only)

### Phase 2: Tasks Generation (Next Step)
Run `/speckit.tasks` to generate step-by-step implementation tasks from this plan.

## Standards Compliance

### Applicable Standards

**Must Review Before Implementation**:
- ✅ `frontend/design-system.md` - Use theme tokens (hsl variables), paired background/foreground colors
- ✅ `frontend/component-libraries.md` - Use shadcn/ui components (Button, Input, Select, Card)
- ✅ `frontend/state-management.md` - Follow TanStack Query patterns, local state guidelines
- ✅ `frontend/performance.md` - Implement debouncing, lazy loading, memoization
- ✅ `global/project-structure.md` - Maintain vertical slice architecture in domains/
- ✅ `global/code-quality.md` - Follow validation workflow, naming conventions
- ✅ `global/error-handling.md` - Handle upload failures, resolution errors gracefully

**Key Compliance Points**:

1. **Design System** (frontend/design-system.md):
   - Use `hsl(var(--primary))` and similar CSS variables for all colors
   - Never hard-code colors like `#3B82F6` or `rgb(59, 130, 246)`
   - Pair background with foreground: `bg-primary` + `text-primary-foreground`
   - Use semantic color names: `destructive` for errors, `muted` for secondary text

2. **Component Libraries** (frontend/component-libraries.md):
   - Import shadcn/ui components from `@/components/ui/`
   - Extend components via props, not by modifying source
   - Preserve Radix UI accessibility features (keyboard nav, ARIA attributes)
   - Use Tooltip, DropdownMenu, Dialog for interactive patterns

3. **State Management** (frontend/state-management.md):
   - Use TanStack Query for server state (Firestore reads)
   - Use useState for component-local state (test inputs)
   - Use useMemo for derived state (resolved prompt, validation)
   - Avoid Zustand for temporary/ephemeral state

4. **Performance** (frontend/performance.md):
   - Debounce expensive operations (resolution logic)
   - Lazy load images in media preview grid
   - Memoize components that render frequently (TestInputsForm)
   - Use React.memo() for pure presentational components

5. **Project Structure** (global/project-structure.md):
   - Place components in `domains/ai-presets/preview/components/`
   - Export only public components via barrel exports (index.ts)
   - Keep hooks in `preview/hooks/` directory
   - Keep utilities in `preview/lib/` directory
   - Colocate tests with source files (e.g., `*.test.ts` next to `*.ts`)

### Post-Implementation Checklist

Before marking feature complete:

- [ ] Run `pnpm app:check` - passes without errors
- [ ] Verify no hard-coded colors (grep for hex/rgb values)
- [ ] Confirm shadcn/ui components used (no custom reimplementations)
- [ ] Check debouncing is active (300ms for resolution)
- [ ] Validate lazy loading for media thumbnails
- [ ] Review project structure matches vertical slice pattern
- [ ] Test on mobile viewport (responsive layout works)
- [ ] Verify touch targets ≥44px (upload zones, dropdowns, buttons)

## Next Steps

1. ✅ Constitution Check - PASSED
2. ✅ Phase 0: Research - COMPLETE
3. ✅ Phase 1: Design & Data Model - COMPLETE
4. **Next**: Run `/speckit.tasks` to generate implementation tasks

**Command**: `/speckit.tasks`

This will create `tasks.md` with step-by-step implementation tasks prioritized by user stories (P1-P5).
