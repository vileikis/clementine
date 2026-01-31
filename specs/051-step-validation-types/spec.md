# Feature Specification: Strongly Typed Step Validation and Simplified Answer Schema

**Feature Branch**: `051-step-validation-types`
**Created**: 2026-01-31
**Status**: Draft
**Input**: User description: "Strongly type step validation and simplify answer schema to use only string and string[] values"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type-Safe Validator Implementation (Priority: P1)

**As a** developer implementing or maintaining step validators
**I want** full TypeScript autocomplete and type checking for step config properties
**So that** I can write validators confidently without constantly checking schemas and avoid runtime errors from accessing non-existent properties

**Why this priority**: This is the foundation of the refactor. Provides immediate value through improved developer experience and catches bugs at compile-time rather than runtime.

**Independent Test**: Can be fully tested by implementing one validator (e.g., scale input) with specific types and verifying TypeScript catches invalid property access at compile-time.

**Acceptance Scenarios**:

1. **Given** a developer is writing a scale validator, **When** they type `config.`, **Then** TypeScript autocomplete shows available properties (min, max, minLabel, maxLabel, required)
2. **Given** a developer accesses `config.nonExistentProperty` in a validator, **When** TypeScript compiles, **Then** compilation fails with clear error message
3. **Given** a validator expects `ExperienceInputScaleStepConfig`, **When** a different step config type is passed, **Then** TypeScript shows type error at compile-time
4. **Given** a developer refactors a config schema, **When** they change a property name, **Then** all validators using that property show TypeScript errors immediately

---

### User Story 2 - Unified Answer Storage Format (Priority: P1)

**As a** system storing and querying session answers
**I want** all answer values to use consistent primitive types (string or string[])
**So that** storage, retrieval, and analytics operations follow predictable patterns without type-specific handling

**Why this priority**: Simplifies data model and eliminates type coercion bugs. Equally critical as type safety since it affects runtime behavior.

**Independent Test**: Can be tested by creating sessions with different step types and verifying all answers are stored as string or string[] in Firestore.

**Acceptance Scenarios**:

1. **Given** a guest answers a yes/no question with "Yes", **When** the answer is saved, **Then** answer value is stored as string "yes" (not boolean true)
2. **Given** a guest selects scale value 3, **When** the answer is saved, **Then** answer value is stored as string "3" (not number 3)
3. **Given** a guest enters short text "Hello", **When** the answer is saved, **Then** answer value is stored as string "Hello"
4. **Given** a guest selects multiple options ["option1", "option2"], **When** the answer is saved, **Then** answer value is stored as string array ["option1", "option2"]
5. **Given** analytics query groups answers by value, **When** processing any input type, **Then** grouping logic works identically without type-specific branches

---

### User Story 3 - Consistent Renderer Behavior (Priority: P2)

**As a** step renderer component
**I want** to save answer values in consistent format regardless of UI control type
**So that** answer handling logic is uniform across all step types

**Why this priority**: Secondary to core type safety and schema changes, but necessary for complete consistency.

**Independent Test**: Can be tested by interacting with each renderer and verifying saved answer format.

**Acceptance Scenarios**:

1. **Given** InputYesNoRenderer with user selecting "Yes", **When** onAnswer is called, **Then** value is "yes" (string)
2. **Given** InputYesNoRenderer with user selecting "No", **When** onAnswer is called, **Then** value is "no" (string)
3. **Given** InputScaleRenderer with user selecting scale value 3, **When** onAnswer is called, **Then** value is "3" (string)
4. **Given** any text input renderer, **When** onAnswer is called, **Then** value is string
5. **Given** multi-select renderer, **When** onAnswer is called, **Then** value is string[]

---

### Edge Cases

- What happens when existing code attempts to access answer values expecting boolean/number types?
  - **Mitigation**: Update all consumer code in same PR to handle string format
  - **Pre-launch**: No existing session data to migrate

- What happens when analytics need numeric aggregation (e.g., average scale rating)?
  - **Mitigation**: Use `Number(answer.value)` for math operations (trivial cost)
  - **Current requirement**: Only counting/grouping (works identically with strings)

- What happens when validator receives step config of wrong type?
  - **Current**: Runtime error or undefined behavior
  - **After**: TypeScript compile error catches at development time

- What happens when renderer UI internally uses boolean/number but needs to save as string?
  - **Mitigation**: Convert at save boundary (e.g., `onAnswer(value ? "yes" : "no")`)
  - **UI layer**: Still uses natural types (boolean for yes/no buttons)

## Requirements *(mandatory)*

### Functional Requirements

**Validation Layer**:

- **FR-001**: Step validators MUST use specific config types from ExperienceStepConfig union instead of `Record<string, unknown>`
- **FR-002**: `validateScaleInput` MUST accept `ExperienceInputScaleStepConfig` type for config parameter
- **FR-003**: `validateYesNoInput` MUST accept `ExperienceInputYesNoStepConfig` type for config parameter
- **FR-004**: `validateMultiSelectInput` MUST accept `ExperienceInputMultiSelectStepConfig` type for config parameter
- **FR-005**: `validateTextInput` MUST accept `ExperienceInputShortTextStepConfig | ExperienceInputLongTextStepConfig` union type for config parameter
- **FR-006**: All validators MUST continue to return `StepValidationResult` with backward-compatible validation logic

**Answer Schema**:

- **FR-007**: Answer value schema MUST be defined as exported Zod schema in shared package (`answerValueSchema`)
- **FR-008**: Answer value type MUST be inferred from schema and exported from shared package (`AnswerValue`)
- **FR-009**: Answer schema value field MUST use `answerValueSchema` instead of inline union definition
- **FR-010**: Answer schema value MUST accept only `string | string[]` types (remove `number` and `boolean`)
- **FR-011**: Answer schema MUST remain backward-compatible with Zod validation (no breaking changes to schema structure)
- **FR-012**: Answer values MUST serialize correctly to Firestore JSON format

**Renderer Layer**:

- **FR-013**: InputYesNoRenderer MUST save answer value as "yes" when Yes button clicked
- **FR-014**: InputYesNoRenderer MUST save answer value as "no" when No button clicked
- **FR-015**: InputScaleRenderer MUST save answer value as string representation of number (e.g., "3" for scale value 3)
- **FR-016**: All text input renderers MUST continue saving answer values as string (no change needed)
- **FR-017**: Multi-select renderer MUST continue saving answer values as string[] (no change needed)
- **FR-018**: Step registry MUST import `AnswerValue` type from shared package instead of defining locally

**Type Safety**:

- **FR-019**: TypeScript MUST provide autocomplete for config properties in all validator functions
- **FR-020**: TypeScript MUST show compile error when accessing non-existent config properties
- **FR-021**: TypeScript MUST show compile error when wrong config type passed to validator function
- **FR-022**: AnswerValue type MUST be guaranteed consistent with answerValueSchema via `z.infer<>`

### Key Entities

**Answer Value**:
- Current (app): Type defined locally as `string | number | boolean | string[]`
- Current (schema): Inline union in answerSchema
- After: Defined as Zod schema and type in shared package
  - Schema: `answerValueSchema = z.union([z.string(), z.array(z.string())])`
  - Type: `AnswerValue = z.infer<typeof answerValueSchema>` (guaranteed consistent)
  - Location: `packages/shared/src/schemas/session/session.schema.ts`
  - Usage: Imported by both session schema and app renderers
- Simplified from 4 types to 2 types: `string | string[]`

**Step Validators**:
- Purpose: Validate user input against step configuration rules
- Current config type: `Record<string, unknown>` (loose typing)
- After config type: Specific discriminated union types from `ExperienceStepConfig`
- Functions: validateScaleInput, validateYesNoInput, validateMultiSelectInput, validateTextInput

**Step Renderers**:
- Purpose: Render step UI and collect user input
- Types: InputYesNoRenderer, InputScaleRenderer, text renderers, multi-select renderer
- Responsibility: Convert UI interactions to answer values in correct format
- Change: Update conversion logic to ensure string/string[] format

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Developer Experience**:

- **SC-001**: Developers writing or modifying validators receive TypeScript autocomplete for all config properties (100% of config properties discoverable via IDE)
- **SC-002**: Invalid config property access is caught at compile-time (0 runtime errors from typos or wrong property names)
- **SC-003**: Refactoring config schemas triggers compile errors in all affected validators (100% coverage of breaking changes)

**Code Quality**:

- **SC-004**: All step validator functions use specific typed config parameters (0 instances of `Record<string, unknown>` for step configs)
- **SC-005**: All answer values stored in Firestore use only string or string[] types (0 instances of boolean or number values in new sessions)
- **SC-006**: All step renderers save answers in consistent string format (100% consistency across step types)

**System Behavior**:

- **SC-007**: Analytics counting/grouping operations work identically for all answer types without type-specific branches
- **SC-008**: Session data structure remains compatible with Firestore JSON serialization (no serialization errors)
- **SC-009**: Existing validation logic produces identical results (100% behavioral compatibility for validation rules)

**Future Extensibility**:

- **SC-010**: Adding new input types (slider, dropdown, etc.) follows same answer storage pattern without special-casing
- **SC-011**: Converting string answers to numbers for math operations (if needed in future) requires minimal code change (single `.map(Number)` call)

## Assumptions

- **Assumption 1**: No existing production session data requires migration (pre-launch state)
- **Assumption 2**: Analytics use cases are primarily counting/grouping (no immediate need for numeric aggregation)
- **Assumption 3**: TypeScript strict mode is enabled in the project
- **Assumption 4**: All config schemas in `@clementine/shared` package are already properly typed with Zod
- **Assumption 5**: Step type discriminator is always known before accessing answer values (step.type check comes first)

## Out of Scope

- Migrating existing session data (no production data exists)
- Changing step config schema structures (only changing how validators reference them)
- Adding new step types or input types (focusing on existing types only)
- Changing validation logic or rules (only changing type signatures)
- Modifying analytics implementation (schema change is transparent to counting/grouping)
- Adding runtime type guards for answer values (TypeScript types are sufficient)
