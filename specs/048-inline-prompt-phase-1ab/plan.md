# Implementation Plan: Inline Prompt Architecture - Phase 1a & 1b Foundation

**Branch**: `048-inline-prompt-phase-1ab` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/048-inline-prompt-phase-1ab/spec.md`

## Summary

Implement foundation for inline prompt architecture by updating shared schemas to support AI-aware features (Phase 1a) and enhancing step editors with name editing and AI context fields (Phase 1b). This establishes the data model and UI foundation needed for creators to configure AI prompts using human-readable step names and attach AI context (promptFragment, promptMedia) to multiselect options.

**Phase 1a** updates Zod schemas in `packages/shared/` to make step names required with regex validation, add AI-aware fields to multiselect options, create new AI node schemas, and remove obsolete variable mappings. **Phase 1b** builds step name editing UI with uniqueness validation, updates StepList to display custom names, and adds promptFragment/promptMedia inputs to the multiselect option editor with visual AI-enabled indicators.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**:
- Shared: Zod 4.1.12 (schema validation), Vitest (testing)
- Frontend: React 19.2.0, TanStack Start 1.132.0, Zustand 5.x (state), shadcn/ui + Radix UI (components)
- Backend: Firebase SDK 12.5.0 (Firestore for persistence)

**Storage**: Firebase Firestore (experience drafts, step configurations)
**Testing**: Vitest for unit tests (packages/shared), Jest patterns for frontend (apps/clementine-app)
**Target Platform**: Web application (mobile-first responsive design, 320px-768px primary viewport)
**Project Type**: Monorepo with shared packages - changes span `packages/shared/` (schemas) and `apps/clementine-app/src/domains/experience/` (UI)

**Performance Goals**:
- Step name validation response < 200ms
- Auto-save debounce delay: 2000ms (reduce Firestore writes)
- Schema validation overhead < 10ms per operation
- StepList render time < 100ms for 10 steps

**Constraints**:
- Step names: max 50 chars, regex `/^[a-zA-Z0-9 \-_]+$/`, case-sensitive uniqueness
- Prompt fragment: max 500 chars
- Must maintain backward compatibility (fallback to title if name is empty)
- Mobile-first design: 44x44px minimum touch targets, responsive layouts

**Scale/Scope**:
- 10 schema files to modify (packages/shared/)
- 8 existing components to enhance (designer/)
- 4 new components to create (step name editor, prompt fragment input, prompt media picker, AI badge)
- 3 new hooks to implement (step name validation, step name update, media upload)
- ~15-20 unit tests for schema validation
- ~10-15 component/hook tests for UI features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅ PASS

**Compliance**: This feature is fully mobile-first compliant.

- Step name text inputs designed for mobile (44px+ height touch targets)
- Inline validation errors displayed without requiring hover (mobile-friendly)
- Debounced auto-save reduces network operations on slower mobile connections
- Prompt fragment textarea with character counter visible on small screens
- Media picker uses native file upload (works on all mobile devices)
- Visual AI badges use icons + text labels (not hover-only tooltips)

**Verification**: Test step name editing, option configuration on iPhone 13 (375px) and Android (360px) viewports before completion.

### Principle II: Clean Code & Simplicity ✅ PASS

**Compliance**: Implementation follows YAGNI and SRP principles.

- **YAGNI**: No premature abstractions - build only required features (step names, AI fields)
- **SRP**: Each component has single responsibility:
  - StepNameEditor: only step name input + validation
  - PromptFragmentInput: only text input with char counter
  - PromptMediaPicker: only media upload + thumbnail display
  - StepListItem: only display (no editing logic)
- **Small functions**: Validation hooks return simple boolean + error message
- **No dead code**: Remove obsolete `variableMappings` field immediately
- **DRY**: Extract step name validation logic into `useValidateStepName` hook (reused across all step editors)

**Simplicity justification**: No complexity violations - straightforward CRUD operations with validation.

### Principle III: Type-Safe Development ✅ PASS

**Compliance**: Full TypeScript strict mode with Zod runtime validation.

- All schema changes use Zod with explicit types (no `z.unknown()` or `any`)
- Step name regex validation: `/^[a-zA-Z0-9 \-_]+$/` enforced at runtime
- Prompt fragment max length enforced in Zod schema (`.max(500)`)
- MediaReference schema already exists and validated
- All new components fully typed (no implicit `any`)
- Strict null checks: handle undefined step names (fallback to title)

**Runtime validation**: All external inputs (form submissions, Firestore reads) validated with Zod before use.

### Principle IV: Minimal Testing Strategy ✅ PASS

**Compliance**: Pragmatic testing focused on critical validation logic.

- **Schema tests** (high value): 100% coverage for validation rules (regex, lengths, required fields)
- **Validation hooks** (high value): Test uniqueness checks, error messages
- **UI components** (lower priority): Basic render tests only, no exhaustive interaction tests
- **Coverage target**: 80%+ for shared package schemas, 60%+ for UI components

**Rationale**: Schema validation is critical (protects data integrity), UI components are lower risk (visual bugs caught in manual testing).

### Principle V: Validation Gates ✅ PASS

**Technical Validation**: Run before every commit:
```bash
pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test
pnpm app:check  # Auto-fix lint + format
pnpm app:type-check
```

**Standards Compliance Review** (before marking complete):
- **Design System** (`frontend/design-system.md`): Use theme tokens for AI badge colors, paired background/foreground
- **Component Libraries** (`frontend/component-libraries.md`): Extend shadcn/ui Input/Textarea for step name and prompt fragment
- **Project Structure** (`global/project-structure.md`): Follow vertical slice architecture in experience/designer domain
- **Zod Validation** (`global/zod-validation.md`): All schema changes follow Zod best practices
- **Code Quality** (`global/code-quality.md`): Clean, well-named, no dead code

**Validation loop**: Format → Lint → Type-check → Test → Standards review → Commit

### Principle VI: Frontend Architecture ✅ PASS

**Compliance**: Client-first pattern with Firebase client SDK.

- **Client-first**: Use Firestore client SDK for reading experience drafts (`onSnapshot` for real-time updates)
- **Mutations via hooks**: `useUpdateExperienceDraft` already exists, extend for step name updates
- **Security**: Firestore rules enforce write validation (no server-side mutations needed for this phase)
- **Real-time updates**: Step name changes reflect immediately across all open designer sessions
- **TanStack Query**: Not needed for this phase (Firestore handles caching via onSnapshot)

**No SSR requirements**: Designer is authenticated app (no SEO needs).

### Principle VII: Backend & Firebase ✅ PASS

**Compliance**: Hybrid SDK pattern with security-first approach.

- **Client SDK**: Use for reading/writing experience drafts (real-time collaboration)
- **Security rules**: Validate step name format and uniqueness at Firestore rule level (future enhancement)
- **Public URLs**: MediaReference already stores full public URLs (instant rendering)
- **No Admin SDK needed**: All operations use user-authenticated client SDK

**Firestore writes**: All mutations go through `useUpdateExperienceDraft` hook (centralized, consistent).

### Principle VIII: Project Structure ✅ PASS

**Compliance**: Vertical slice architecture maintained.

**Affected domains**:
```
packages/shared/
└── src/schemas/experience/
    ├── step.schema.ts (update name validation)
    ├── steps/input-multi-select.schema.ts (add AI fields)
    ├── transform.schema.ts (remove variableMappings)
    └── nodes/ (new)
        ├── ai-image-node.schema.ts (new)
        └── ref-media-entry.schema.ts (new)

apps/clementine-app/src/domains/experience/
├── designer/
│   ├── components/
│   │   ├── StepList.tsx (update to show step.name)
│   │   ├── StepListItem.tsx (update display format)
│   │   ├── StepNameEditor.tsx (new)
│   │   └── AIEnabledBadge.tsx (new)
│   └── hooks/
│       ├── useValidateStepName.ts (new)
│       └── useUpdateStepName.ts (new)
└── steps/
    └── multiselect/
        ├── components/
        │   ├── MultiSelectOptionEditor.tsx (enhance)
        │   ├── PromptFragmentInput.tsx (new)
        │   └── PromptMediaPicker.tsx (new)
        └── hooks/
            └── useUploadPromptMedia.ts (new)
```

**Barrel exports**: All new components/hooks exported via `index.ts` in their respective folders.

**Restricted API**: Internal validation logic and Firestore mutations stay private to domain.

### Constitution Compliance Summary

✅ **All gates passed** - No violations, no complexity justifications needed.

**Re-evaluation after Phase 1**: Verify standards compliance (design system tokens, component extensions, file naming).

## Project Structure

### Documentation (this feature)

```text
specs/048-inline-prompt-phase-1ab/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (already created)
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (entity definitions)
├── quickstart.md        # Phase 1 output (implementation guide)
├── contracts/           # Phase 1 output (schema definitions - TypeScript interfaces)
│   ├── step-schemas.ts  # Updated step schemas
│   └── transform-schemas.ts  # Updated transform schemas
├── checklists/
│   └── requirements.md  # Quality validation checklist (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo Structure (Clementine)
packages/
└── shared/
    └── src/
        └── schemas/
            └── experience/
                ├── step.schema.ts (modify)
                ├── steps/
                │   ├── input-multi-select.schema.ts (modify)
                │   └── index.ts (update exports)
                ├── transform.schema.ts (modify)
                └── nodes/ (new directory)
                    ├── ai-image-node.schema.ts (new)
                    ├── ref-media-entry.schema.ts (new)
                    └── index.ts (new)

apps/
└── clementine-app/
    └── src/
        └── domains/
            └── experience/
                ├── designer/
                │   ├── components/
                │   │   ├── StepList.tsx (modify)
                │   │   ├── StepListItem.tsx (modify)
                │   │   ├── StepNameEditor.tsx (new)
                │   │   ├── AIEnabledBadge.tsx (new)
                │   │   └── index.ts (update exports)
                │   ├── hooks/
                │   │   ├── useValidateStepName.ts (new)
                │   │   ├── useUpdateStepName.ts (new)
                │   │   └── index.ts (update exports)
                │   └── stores/
                │       └── useExperienceDesignerStore.ts (modify if needed)
                └── steps/
                    └── multiselect/
                        ├── components/
                        │   ├── MultiSelectOptionEditor.tsx (modify)
                        │   ├── PromptFragmentInput.tsx (new)
                        │   ├── PromptMediaPicker.tsx (new)
                        │   └── index.ts (update exports)
                        └── hooks/
                            ├── useUploadPromptMedia.ts (new)
                            └── index.ts (update exports)
```

**Structure Decision**: This feature follows the existing monorepo vertical slice architecture. Shared schemas live in `packages/shared/` for reuse across frontend and backend. UI components follow domain-driven structure under `domains/experience/` with separate concerns for designer (canvas/list) and steps (individual step editors). No new top-level directories needed - all changes fit existing structure.

## Complexity Tracking

> **No complexity violations** - all Constitution gates passed without justifications needed.

This implementation follows clean code principles with simple, focused components and hooks. No premature abstractions, repository patterns, or unnecessary complexity introduced.

---

## Phase 0: Research & Decisions

### Research Scope

No unknowns requiring research - all technical decisions are clear:

1. **Step Name Validation**: Use Zod regex validation `/^[a-zA-Z0-9 \-_]+$/` with `.trim()` and `.min(1).max(50)` (industry standard for identifiers that support spaces)

2. **Uniqueness Check**: Implement in React hook (`useValidateStepName`) that scans all steps in the experience on blur event (O(n) complexity acceptable for small step counts, typically < 10 steps)

3. **Auto-Save Pattern**: Reuse existing `useUpdateExperienceDraft` hook with debounce (2000ms delay already used in designer, consistent UX)

4. **AI Badge Design**: Use existing shadcn Badge component with custom variant (reference `frontend/design-system.md` for theme tokens)

5. **Media Upload**: Reuse existing `useUploadExperienceCover` pattern for prompt media uploads (proven, consistent with platform)

### Decision Log

**Decision 1: Step Name Required vs Optional**
- **Chosen**: Required (remove `.optional()`)
- **Rationale**: Step names are foundation of inline prompts - cannot reference steps without names. Auto-generate on creation to ensure names always exist.
- **Alternatives considered**:
  - Keep optional, fallback to ID: Rejected (UUIDs are not user-friendly in prompts)
  - Keep optional, require on transform config: Rejected (fragile, validation too late)

**Decision 2: Step Name Uniqueness Scope**
- **Chosen**: Unique across entire experience (case-sensitive)
- **Rationale**: Prompt references like `@{step:Pet Choice}` must be unambiguous. Case-sensitive because names may be user-visible.
- **Alternatives considered**:
  - Unique per step type: Rejected (ambiguous references if two types have same name)
  - Case-insensitive: Rejected (limits user flexibility, harder to validate)

**Decision 3: Prompt Fragment Storage**
- **Chosen**: Store as plain string in `promptFragment` field (max 500 chars)
- **Rationale**: Simple, validates with Zod, easy to test. No need for structured data or templates.
- **Alternatives considered**:
  - Structured JSON with placeholders: Rejected (over-engineered for current needs, YAGNI)
  - Markdown support: Rejected (adds complexity, no requirement for formatting)

**Decision 4: Prompt Media Storage**
- **Chosen**: Reuse existing `MediaReference` schema (mediaAssetId, url, filePath, fileName)
- **Rationale**: Proven schema already in use for experience covers, consistent data model.
- **Alternatives considered**:
  - Inline base64: Rejected (bloats Firestore docs, slow to load)
  - New custom schema: Rejected (duplicates existing, violates DRY)

**Decision 5: Backward Compatibility Strategy**
- **Chosen**: Fallback to `step.config.title` if `step.name` is empty
- **Rationale**: Existing experiences don't have names yet. Graceful degradation prevents breaking changes.
- **Alternatives considered**:
  - Migration script: Rejected (risky, pre-launch means no production data)
  - Require names on publish: Rejected (blocks users, poor UX)

**Decision 6: Multiselect Option Component Architecture**
- **Chosen**: Callback pattern (consistent with existing config panels)
- **Rationale**:
  - Existing architecture uses callbacks (`onConfigChange`) for all step config panels
  - `StepConfigPanelContainer` manages form + auto-save (2s debounce) at step level
  - Individual config panels receive `step` + `onConfigChange` callback
  - Callbacks are simpler for array management than react-hook-form paths
  - No race conditions: `useAutoSave` debounces, `stepsRef` prevents stale closures
  - Consistent pattern: 2-3 levels deep (ConfigPanel → OptionEditor → Input)
- **Alternatives considered**:
  - Form context with useFormContext: Rejected (breaking change, couples components to form, harder to test, high effort for medium reward)
  - Hybrid (form for simple fields, callbacks for arrays): Rejected (mixed patterns, less consistent)
- **Implementation**:
  - `InputMultiSelectConfigPanel` manages options array
  - `MultiSelectOptionEditor` receives `option` + `onChange` callback
  - `PromptFragmentInput` and `PromptMediaPicker` receive value + onChange
  - Updates flow: Input → OptionEditor → ConfigPanel → onConfigChange → Container (form + save)

**Architecture Flow**:
```
ExperienceDesignerPage (orchestrator)
  ↓ manages local steps state
  ↓ passes setSteps as onStepsChange
StepConfigPanelContainer (auto-save container)
  ↓ react-hook-form + useAutoSave (2s debounce)
  ↓ handleConfigChange: updates form + local state + triggers save
StepConfigPanel (router)
  ↓ passes onConfigChange to...
InputMultiSelectConfigPanel
  ↓ manages options array
  ↓ handleOptionChange(index, updates) → onConfigChange({ options: [...] })
MultiSelectOptionEditor
  ↓ receives option + onChange callback
  ↓ onChange({ promptFragment: value })
PromptFragmentInput / PromptMediaPicker
  ↓ controlled inputs with onChange
```

### No Additional Research Required

All technical approaches are well-established patterns in the codebase. No experimental libraries, no architectural changes, no performance concerns requiring investigation.

---

## Phase 1: Design & Data Model

### Data Model

#### Entity: ExperienceStep (Updated)

**Purpose**: Represents a single step in the experience flow with required unique name for prompt references.

**Fields**:
- `id`: UUID (unchanged)
- `type`: ExperienceStepType enum (unchanged)
- `name`: string (CHANGED: now required, validated with regex `/^[a-zA-Z0-9 \-_]+$/`, max 50 chars, trimmed)
- `config`: Step-specific configuration object (unchanged)

**Validation Rules**:
- Name MUST be present (no empty strings after trim)
- Name MUST match regex pattern (letters, numbers, spaces, hyphens, underscores only)
- Name MUST be <= 50 characters
- Name MUST be unique within experience (case-sensitive)
- Name automatically trimmed before validation (whitespace-only names rejected)

**State Transitions**:
1. Step created → auto-generate name from type (e.g., "Pet Choice" for multiselect)
2. User edits name → validate format on blur
3. User edits name → check uniqueness on blur
4. Valid name → debounced auto-save to Firestore
5. Invalid name → show inline error, prevent save

**Relationships**:
- One experience has many steps (1:N)
- Step names referenced in AI node prompts (referential integrity via validation)

#### Entity: MultiSelectOption (Updated)

**Purpose**: Selectable option in multiselect step, optionally enhanced with AI context.

**Fields**:
- `value`: string (unchanged, 1-100 chars, option display text)
- `promptFragment`: string? (NEW, optional, max 500 chars, text inserted into prompt when selected)
- `promptMedia`: MediaReference? (NEW, optional, media reference inserted into prompt when selected)

**Validation Rules**:
- promptFragment max 500 characters (enforced by Zod)
- promptMedia must be valid MediaReference if present (Zod schema validation)
- At least one of (value, promptFragment, promptMedia) must be non-empty (implicit from current value validation)

**AI-Aware Indicator**:
- Option is "AI-enabled" if promptFragment OR promptMedia is set
- Visual badge shown in option list when AI-enabled

**Relationships**:
- One multiselect step has many options (1:N)
- Option promptMedia references MediaAsset (N:1, optional)

#### Entity: MediaReference (Unchanged)

**Purpose**: Reference to uploaded media file in Firebase Storage.

**Fields** (already defined, no changes):
- `mediaAssetId`: string (unique identifier)
- `url`: string (full public URL)
- `filePath`: string (storage path)
- `fileName`: string? (optional original filename)

**Usage in this feature**:
- Used for MultiSelectOption.promptMedia
- Used for RefMediaEntry (Phase 1c, out of scope for 1a/1b)

#### Entity: RefMediaEntry (New, Phase 1a)

**Purpose**: MediaReference extended with display name for AI node reference media.

**Fields**:
- Extends all MediaReference fields
- `displayName`: string (NEW, human-readable name for use in prompt editor autocomplete)

**Validation Rules**:
- displayName required (non-empty string)
- displayName unique within AI node (not enforced in schema, validated in UI)
- displayName max length (TBD in Phase 1c implementation)

**Note**: RefMedia management UI is Phase 1c (out of scope). Schema defined now for completeness.

#### Entity: AIImageNode (New, Phase 1a)

**Purpose**: Transform pipeline node for AI image generation with inline prompt configuration.

**Fields**:
- `id`: string (node identifier)
- `type`: "ai.imageGeneration" (literal discriminator)
- `config`: AIImageNodeConfig
  - `model`: string (e.g., "gemini-2.5-pro")
  - `aspectRatio`: "1:1" | "3:2" | "2:3" | "9:16" | "16:9"
  - `prompt`: string (prompt template with `@{step:name}` and `@{ref:mediaAssetId}` placeholders)
  - `refMedia`: RefMediaEntry[] (reference media for prompt, managed in Phase 1c)

**Validation Rules**:
- prompt is non-empty string (required)
- refMedia is array (may be empty)
- model and aspectRatio enums validated by Zod

**Relationships**:
- Part of TransformConfig.nodes array (1:N)
- Prompt references ExperienceSteps by name (N:N via string references)
- refMedia contains MediaReferences (1:N)

**Note**: Prompt editing UI and refMedia management are Phase 1c+ (out of scope). Schema defined now to enable incremental development.

#### Entity: TransformConfig (Updated)

**Purpose**: Configuration for experience transform pipeline.

**Fields**:
- `nodes`: TransformNode[] (unchanged)
- `variableMappings`: VariableMapping[] (REMOVED - obsolete with inline architecture)
- `outputFormat`: OutputFormat? (unchanged)

**Breaking Change**: Removing `variableMappings` is safe because:
- System is pre-launch (no production data)
- Field was never fully implemented (no UI, no runtime usage)
- Inline prompt architecture replaces this with step name references

**Migration**: None needed (pre-launch, no data to migrate).

### Schema Update Summary

| Schema | Change Type | Rationale |
|--------|-------------|-----------|
| `experienceStepNameSchema` | Modified | Make required, add regex validation for AI-safe identifiers |
| `experienceInputMultiSelectStepConfigSchema` | Modified | Add `promptFragment` and `promptMedia` optional fields for AI context |
| `refMediaEntrySchema` | New | Extend MediaReference with displayName for prompt editor autocomplete |
| `aiImageNodeSchema` | New | Define AI image generation node structure (enables Phase 1c+) |
| `transformConfigSchema` | Modified | Remove obsolete `variableMappings` field |
| `transformNodeSchema` | Modified | Support typed configs (discriminated union for AI node) |

### Type Safety Guarantees

All schemas generate strict TypeScript types:
```typescript
// Step names are required strings (not string | undefined)
type ExperienceStep = {
  id: string
  type: ExperienceStepType
  name: string // <-- Changed from `string | undefined` to `string`
  config: ExperienceStepConfig
}

// Multiselect options have optional AI fields
type MultiSelectOption = {
  value: string
  promptFragment?: string  // <-- NEW
  promptMedia?: MediaReference  // <-- NEW
}

// AI node config is fully typed
type AIImageNodeConfig = {
  model: string
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
  prompt: string
  refMedia: RefMediaEntry[]
}
```

### API Contracts

**No REST/GraphQL APIs** - this feature uses Firebase client SDK for all operations.

**Firestore Document Structure** (contracts):

```typescript
// experience-drafts/{draftId}
interface ExperienceDraft {
  id: string
  workspaceId: string
  steps: ExperienceStep[]  // <-- Updated with required names
  transformConfig?: TransformConfig  // <-- Updated (no variableMappings)
  // ... other fields unchanged
}

// ExperienceStep with required name
interface ExperienceStep {
  id: string
  type: 'input.multiSelect' | 'capture.photo' | /* ... */
  name: string  // <-- Now required, validated
  config: {
    title: string
    required: boolean
    options?: Array<{  // <-- For multiselect steps
      value: string
      promptFragment?: string  // <-- NEW
      promptMedia?: MediaReference  // <-- NEW
    }>
    // ... type-specific fields
  }
}
```

**Contract Files** (generated in Phase 1):

- `contracts/step-schemas.ts`: TypeScript interfaces for all step schemas
- `contracts/transform-schemas.ts`: TypeScript interfaces for transform nodes

These files serve as documentation and can be used for validation in other tools (e.g., backend functions, API integrations).

---

## Implementation Quickstart

### Prerequisites

1. Checkout feature branch: `git checkout 048-inline-prompt-phase-1ab`
2. Install dependencies: `pnpm install`
3. Verify baseline: `pnpm app:check && pnpm app:type-check`

### Phase 1a: Schema Updates (Day 1-2)

**Goal**: Update shared schemas to support AI-aware features.

**Steps**:

1. **Update step name schema** (`packages/shared/src/schemas/experience/step.schema.ts`):
   ```typescript
   // BEFORE
   export const experienceStepNameSchema = z.string().trim().min(1).max(50).optional()

   // AFTER
   export const experienceStepNameSchema = z.string()
     .trim()
     .min(1, 'Step name is required')
     .max(50, 'Step name must be 50 characters or less')
     .regex(/^[a-zA-Z0-9 \-_]+$/, 'Step name can only contain letters, numbers, spaces, hyphens, and underscores')
   ```

2. **Update multiselect option schema** (`packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`):
   ```typescript
   // Add to imports
   import { mediaReferenceSchema } from '../media.schema'

   // Update option schema
   export const multiSelectOptionSchema = z.object({
     value: z.string().min(1).max(100),
     promptFragment: z.string().max(500).optional(),
     promptMedia: mediaReferenceSchema.optional(),
   })

   // Update config schema
   export const experienceInputMultiSelectStepConfigSchema = z.object({
     title: z.string().max(200),
     required: z.boolean().default(false),
     options: z.array(multiSelectOptionSchema).min(2).max(10),
     multiSelect: z.boolean().default(false),
   })
   ```

3. **Create AI node schemas** (new files):
   - `packages/shared/src/schemas/experience/nodes/ref-media-entry.schema.ts`
   - `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`
   - `packages/shared/src/schemas/experience/nodes/index.ts`

4. **Update transform schema** (`packages/shared/src/schemas/experience/transform.schema.ts`):
   ```typescript
   // Remove variableMappings field
   export const transformConfigSchema = z.looseObject({
     nodes: z.array(transformNodeSchema).default([]),
     // DELETE: variableMappings: z.array(variableMappingSchema).default([]),
     outputFormat: outputFormatSchema.nullable().default(null),
   })

   // Remove variableMappingSchema export
   ```

5. **Write unit tests** (`packages/shared/src/schemas/experience/*.test.ts`):
   - Test step name validation (required, regex, max length)
   - Test promptFragment max length
   - Test promptMedia optional validation
   - Test AI node schema structure
   - Test backward compatibility (existing data still validates)

6. **Build and test**:
   ```bash
   pnpm --filter @clementine/shared build
   pnpm --filter @clementine/shared test
   ```

**Success Criteria**:
- ✅ All schema tests pass
- ✅ TypeScript types regenerate without errors
- ✅ No breaking changes for existing valid data
- ✅ Step names are required in generated types

### Phase 1b: Step Editor UI (Day 3-5)

**Goal**: Add step name editing and AI-aware fields to step editors.

**Steps**:

1. **Create validation hook** (`apps/clementine-app/src/domains/experience/designer/hooks/useValidateStepName.ts`):
   ```typescript
   export function useValidateStepName(stepId: string) {
     const steps = useExperienceDesignerStore(state => state.draft?.steps ?? [])

     return (name: string): { valid: boolean; error?: string } => {
       // Check format (Zod validation)
       const result = experienceStepNameSchema.safeParse(name)
       if (!result.success) {
         return { valid: false, error: result.error.errors[0].message }
       }

       // Check uniqueness (case-sensitive)
       const duplicate = steps.find(s => s.id !== stepId && s.name === name)
       if (duplicate) {
         return { valid: false, error: `Name "${name}" is already used` }
       }

       return { valid: true }
     }
   }
   ```

2. **Create update hook** (`apps/clementine-app/src/domains/experience/designer/hooks/useUpdateStepName.ts`):
   - Wrap `useUpdateExperienceDraft` to update step name
   - No debounce needed (immediate update for dialog)
   - Return promise for dialog confirmation

3. **Create RenameStepDialog component** (`apps/clementine-app/src/domains/experience/designer/components/RenameStepDialog.tsx`):
   - Dialog with step name input
   - Cursor positioned at end (not fully selected)
   - Real-time validation with inline error display
   - Cancel/Rename buttons
   - Enter key submits, Escape cancels
   - Autofocus on input when opened

4. **Update StepListItem context menu** (`apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`):
   - Add "Rename..." menu item with Pencil icon
   - Position before "Delete" (safer positioning)
   - Call onRename callback with step ID

5. **Update StepList component** (`apps/clementine-app/src/domains/experience/designer/components/StepList.tsx`):
   - Add rename dialog state (open/closed, stepId)
   - Pass onRename callback to StepListItem
   - Render RenameStepDialog
   - Display `step.name` instead of `step.config.title`
   - Fallback: `step.name || step.config.title || 'Untitled Step'`

6. **Add step type badge to StepListItem**:
   - Show step type badge/icon next to name
   - Use theme tokens for badge colors
   - Keep compact (don't overwhelm step name)

7. **Create StepNameEditor component** (`apps/clementine-app/src/domains/experience/designer/components/StepNameEditor.tsx`):
   - Input field with label "Step Name"
   - Debounced onChange (2000ms)
   - Inline validation error display
   - Call `useValidateStepName` hook on blur
   - Auto-save on valid change

8. **Add StepNameEditor to step config panels**:
   - Insert at top of all step settings panels
   - Wire up validation and update hooks
   - Provides alternative way to rename (while configuring)

9. **Create PromptFragmentInput component** (`apps/clementine-app/src/domains/experience/steps/multiselect/components/PromptFragmentInput.tsx`):
   - Textarea with label "Prompt Fragment (optional)"
   - Help text: "Text to insert when this option is selected"
   - Character counter (X/500)
   - Debounced onChange (2000ms)

10. **Create PromptMediaPicker component** (`apps/clementine-app/src/domains/experience/steps/multiselect/components/PromptMediaPicker.tsx`):
    - File upload button (use shadcn Button + Input[type=file])
    - Thumbnail preview when media set
    - Remove button (X icon)
    - Call `useUploadPromptMedia` hook

11. **Create media upload hook** (`apps/clementine-app/src/domains/experience/steps/multiselect/hooks/useUploadPromptMedia.ts`):
    - Reuse `useUploadExperienceCover` pattern
    - Upload to Firebase Storage: `prompt-media/{workspaceId}/{mediaAssetId}`
    - Return MediaReference

12. **Update MultiSelectOptionEditor** (`apps/clementine-app/src/domains/experience/steps/multiselect/components/MultiSelectOptionEditor.tsx`):
    - Add PromptFragmentInput below value input
    - Add PromptMediaPicker below promptFragment
    - Option list shows value only (clean, simple)

13. **Write component tests**:
    - RenameStepDialog validation behavior
    - StepNameEditor validation behavior
    - PromptFragmentInput character counter
    - PromptMediaPicker upload flow
    - StepList fallback logic

14. **Validation loop**:
    ```bash
    pnpm app:check  # Format + lint
    pnpm app:type-check
    pnpm app:test  # Run tests
    ```

15. **[LOWEST PRIORITY] Create AIEnabledBadge component** (optional - evaluate need after implementation):
    - Small badge with icon (Sparkles) + "AI"
    - Use theme tokens: `bg-primary/10 text-primary`
    - Show in option list when option has promptFragment OR promptMedia
    - **Decision point**: After implementing, evaluate if visual indicator adds value or creates clutter

**Success Criteria**:
- ✅ Can rename steps via context menu dialog
- ✅ Can rename steps via config panel inline editor
- ✅ Step name validation works in both contexts
- ✅ StepList shows custom names with fallback
- ✅ Can add promptFragment and promptMedia to options
- ✅ Changes persist to Firestore
- ⚠️ AIEnabledBadge implementation deferred (evaluate need)

### Testing & Validation

**Unit Tests** (packages/shared/):
- Step name schema: required, regex, max length
- Multiselect option schema: promptFragment max 500, promptMedia optional
- AI node schema: all fields validate correctly
- Backward compatibility: existing data still validates

**Component Tests** (apps/clementine-app/):
- StepNameEditor: shows validation errors, prevents duplicates
- PromptFragmentInput: character counter, max length enforcement
- PromptMediaPicker: upload, preview, remove
- StepList: displays names, fallback to title

**Manual Testing Checklist**:
- [ ] Create new experience, add step, verify auto-generated name
- [ ] Edit step name with spaces (e.g., "Pet Choice"), verify accepted
- [ ] Try duplicate step name, verify error shown
- [ ] Try invalid characters (!@#$%), verify error shown
- [ ] Edit step name, verify StepList updates immediately
- [ ] Add promptFragment to multiselect option, verify saves
- [ ] Upload promptMedia to multiselect option, verify thumbnail shows
- [ ] Verify AI badge appears on AI-enabled options
- [ ] Reload page, verify all changes persisted
- [ ] Test on mobile viewport (375px), verify responsive layout

**Performance Validation**:
- [ ] Step name validation responds within 200ms
- [ ] Auto-save triggers after 2000ms debounce
- [ ] StepList renders 10 steps in < 100ms
- [ ] No excessive Firestore writes (max 1 write per 2s during editing)

### Standards Compliance Verification

Before marking complete, verify:

- **Design System** (`frontend/design-system.md`):
  - [ ] AI badge uses theme tokens (not hard-coded colors)
  - [ ] Background/foreground color pairing correct
  - [ ] Responsive spacing follows design system scale

- **Component Libraries** (`frontend/component-libraries.md`):
  - [ ] StepNameEditor extends shadcn Input
  - [ ] PromptFragmentInput extends shadcn Textarea
  - [ ] AIEnabledBadge uses shadcn Badge component
  - [ ] All components preserve accessibility (ARIA labels)

- **Project Structure** (`global/project-structure.md`):
  - [ ] New components in correct domain directories
  - [ ] Barrel exports updated (`index.ts` files)
  - [ ] File naming follows `[domain].[purpose].tsx` pattern

- **Zod Validation** (`global/zod-validation.md`):
  - [ ] All external inputs validated with Zod
  - [ ] Error messages user-friendly
  - [ ] No `any` types or unsafe parsing

- **Code Quality** (`global/code-quality.md`):
  - [ ] No dead code (variableMappings removed)
  - [ ] Functions small and focused (< 30 lines)
  - [ ] Clear variable names
  - [ ] Comments explain "why" not "what"

---

## Next Steps

After completing Phase 1a & 1b:

1. **Manual testing**: Follow testing checklist above
2. **Create PR**: Include before/after screenshots, test coverage report
3. **Code review**: Ensure standards compliance verification complete
4. **Deploy to dev**: Test on real mobile devices
5. **Generate tasks**: Run `/speckit.tasks` to break down Phase 1c (refMedia management)

**Phase 1c Preview** (out of scope for this plan):
- RefMedia section UI (upload, display, delete)
- DisplayName editing and uniqueness validation
- RefMedia integration with AI node editor

**Long-term** (Phases 1d-1i):
- Lexical prompt editor with step/media mentions
- Prompt resolution algorithm
- Test run dialog with live preview
- Transform pipeline integration
