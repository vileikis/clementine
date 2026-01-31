# Data Model: Strongly Typed Step Validation and Simplified Answer Schema

**Feature**: 051-step-validation-types
**Phase**: 1 (Design & Contracts)
**Date**: 2026-01-31

## Overview

This refactor modifies how step configuration types are used in validators and how answer values are stored. The data model changes focus on type definitions and schema constraints rather than database structure.

## Entities

### Answer (Modified)

**Purpose**: Represents a collected answer from an input step

**Location**: `packages/shared/src/schemas/session/session.schema.ts`

**Schema Changes**:

```typescript
// Before
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([
    z.string(),       // Text inputs
    z.number(),       // Scale inputs (REMOVED)
    z.boolean(),      // Yes/No inputs (REMOVED)
    z.array(z.string()), // Multi-select inputs
  ]),
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})

// After (with answerValueSchema extraction)
/**
 * Answer value schema - extracted for reusability
 * Single source of truth for answer value types
 */
export const answerValueSchema = z.union([
  z.string(),          // Text, yes/no ("yes"/"no"), scale ("1"-"5")
  z.array(z.string()), // Multi-select
])

/**
 * Answer value type inferred from schema
 * Guaranteed consistency between type and schema
 */
export type AnswerValue = z.infer<typeof answerValueSchema>

/**
 * Answer schema - uses answerValueSchema
 */
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: answerValueSchema,  // ✅ Uses extracted schema
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})
```

**Validation Rules**:
- `stepId`: Required, references step.id from ExperienceStep
- `stepType`: Required, one of ExperienceStepType enum values
- `value`: Required, must be string or string array (simplified from 4 types to 2)
- `context`: Optional, stores step-specific AI generation data
- `answeredAt`: Required, Unix timestamp in milliseconds

**State Transitions**: None (immutable once created)

**Relationships**:
- Belongs to: Session (session.answers array)
- References: ExperienceStep (via stepId)

**Value Format by Step Type**:

| Step Type            | Value Type | Format Example     | Previous Format |
| -------------------- | ---------- | ------------------ | --------------- |
| `input.scale`        | `string`   | `"3"`              | `number` 3      |
| `input.yesNo`        | `string`   | `"yes"` or `"no"`  | `boolean` true  |
| `input.shortText`    | `string`   | `"Hello world"`    | `string` (same) |
| `input.longText`     | `string`   | `"Long text..."`   | `string` (same) |
| `input.multiSelect`  | `string[]` | `["opt1", "opt2"]` | `string[]` (same) |

---

### StepConfig (Type Definition - Not a Data Entity)

**Purpose**: Type definition for step configuration used in validators

**Location**: `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts`

**Type Changes**:

```typescript
// Before
type StepConfig = Record<string, unknown>

function validateScaleInput(
  config: StepConfig,  // Loose typing
  input: unknown,
  isRequired: boolean
): StepValidationResult

// After
import type {
  ExperienceInputScaleStepConfig,
  ExperienceInputYesNoStepConfig,
  ExperienceInputMultiSelectStepConfig,
  ExperienceInputShortTextStepConfig,
  ExperienceInputLongTextStepConfig,
} from '@clementine/shared'

function validateScaleInput(
  config: ExperienceInputScaleStepConfig,  // Specific type
  input: unknown,
  isRequired: boolean
): StepValidationResult
```

**Config Type Mappings**:

| Step Type            | Validator Function           | Config Type                               |
| -------------------- | ---------------------------- | ----------------------------------------- |
| `input.scale`        | `validateScaleInput`         | `ExperienceInputScaleStepConfig`          |
| `input.yesNo`        | `validateYesNoInput`         | `ExperienceInputYesNoStepConfig`          |
| `input.multiSelect`  | `validateMultiSelectInput`   | `ExperienceInputMultiSelectStepConfig`    |
| `input.shortText`    | `validateTextInput`          | `ExperienceInputShortTextStepConfig`      |
| `input.longText`     | `validateTextInput`          | `ExperienceInputLongTextStepConfig`       |

**Properties by Config Type**:

**ExperienceInputScaleStepConfig**:
```typescript
{
  title: string
  min: number           // TypeScript now autocompletes this
  max: number           // TypeScript now autocompletes this
  minLabel?: string
  maxLabel?: string
  required: boolean
}
```

**ExperienceInputYesNoStepConfig**:
```typescript
{
  title: string
  required: boolean
}
```

**ExperienceInputMultiSelectStepConfig**:
```typescript
{
  title: string
  options: MultiSelectOption[]
  multiSelect: boolean
  required: boolean
}
```

**ExperienceInputShortTextStepConfig**:
```typescript
{
  title: string
  placeholder?: string
  maxLength: number
  required: boolean
}
```

**ExperienceInputLongTextStepConfig**:
```typescript
{
  title: string
  placeholder?: string
  maxLength: number
  required: boolean
}
```

---

### AnswerValue (Type Definition - Not a Data Entity)

**Purpose**: Type definition for answer values used across app and shared package

**Location Changes**:
- **Before**: Defined locally in `apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts`
- **After**: Defined in `packages/shared/src/schemas/session/session.schema.ts` and imported by app

**Schema & Type Definition**:

```typescript
// In packages/shared/src/schemas/session/session.schema.ts

/**
 * Answer value schema - single source of truth
 */
export const answerValueSchema = z.union([
  z.string(),          // Text, yes/no, scale
  z.array(z.string()), // Multi-select
])

/**
 * Answer value type inferred from schema
 * Guaranteed consistency with schema
 */
export type AnswerValue = z.infer<typeof answerValueSchema>
```

**App Usage**:

```typescript
// In apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts

// Before (local definition)
// export type AnswerValue = string | number | boolean | string[]

// After (import from shared)
import type { AnswerValue } from '@clementine/shared'

// Optional re-export for convenience
export type { AnswerValue }
```

**Benefits**:
- Single source of truth for answer value types
- Type guaranteed consistent with schema via `z.infer<>`
- Shared between session schema and app renderers
- Eliminates risk of type drift between schema and usage

**Usage**: Type parameter for renderer props and runtime state

**Validation**: Enforced by `answerValueSchema` at runtime, TypeScript at compile-time

---

## Data Flow

### Answer Creation Flow

```
User Interaction (UI Component)
  ↓
Renderer Component (Natural Types)
  • Yes/No: boolean (internal state)
  • Scale: number (internal state)
  • Text: string (internal state)
  ↓
onAnswer Callback (Save Boundary - Type Conversion)
  • Yes/No: boolean → "yes"/"no" string
  • Scale: number → String(number)
  • Text: string → string (passthrough)
  ↓
Runtime Container (Session State)
  • Stores answer with string/string[] value
  ↓
Firestore (Persistence)
  • Serializes as JSON primitive (string/array)
```

### Validation Flow

```
Runtime Container (Submit Request)
  ↓
validateStepInput (Main Switch)
  • Checks step.type discriminator
  ↓
Specific Validator Function (Typed Config)
  • validateScaleInput(config: ExperienceInputScaleStepConfig, ...)
  • validateYesNoInput(config: ExperienceInputYesNoStepConfig, ...)
  • etc.
  ↓
Validation Logic (Type-Safe Property Access)
  • TypeScript autocompletes config.min, config.max, etc.
  • Compiler errors on invalid property access
  ↓
ValidationResult (Success/Error)
  • { isValid: true } or { isValid: false, error: "..." }
```

---

## Migration Strategy

**Status**: Not applicable (pre-launch, no production data)

**Future Considerations** (if data existed):

1. **Identify affected sessions**:
   ```typescript
   // Firestore query for sessions with boolean/number answers
   const affectedSessions = await firestore
     .collection('sessions')
     .where('answers', 'array-contains-any', [
       { value: { '!=': null } } // Complex query not directly supported
     ])
     .get()
   ```

2. **Normalization function**:
   ```typescript
   function normalizeAnswerValue(value: unknown, stepType: string): string | string[] {
     if (typeof value === 'boolean') {
       return value ? 'yes' : 'no'
     }
     if (typeof value === 'number') {
       return String(value)
     }
     if (typeof value === 'string') {
       return value
     }
     if (Array.isArray(value)) {
       return value
     }
     throw new Error(`Invalid answer value type: ${typeof value}`)
   }
   ```

3. **Migration script**:
   - Read all sessions
   - Transform answers with normalizeAnswerValue
   - Write back to Firestore
   - Verify data integrity

**Current Plan**: Deploy schema change directly (no migration needed)

---

## Validation Rules Summary

### Answer Value Validation

**Per Step Type**:

- **input.scale**:
  - Value must be string
  - When parsed as number, must be integer
  - When parsed as number, must be between config.min and config.max

- **input.yesNo**:
  - Value must be string
  - Value must be exactly "yes" or "no"

- **input.shortText** / **input.longText**:
  - Value must be string
  - If required, value.trim().length > 0
  - value.length <= config.maxLength

- **input.multiSelect**:
  - Value must be string[]
  - All elements must be valid option values from config.options
  - If !config.multiSelect, array.length must equal 1
  - If config.multiSelect, array.length >= 1

### Config Type Validation

**Type Safety**:
- Enforced at compile-time by TypeScript
- Each validator function signature specifies exact config type
- Compiler errors if wrong config type passed

**Runtime Safety**:
- Config already validated at ExperienceStep schema level
- Validators trust config structure (no runtime validation needed)
- Type assertion is safe: `step.config as ExperienceInputScaleStepConfig`

---

## Impact Analysis

### Database Impact

**Firestore Collections**: None (schema change, not structure change)

**Answer Documents**:
- Before: `{ value: 3 }` or `{ value: true }`
- After: `{ value: "3" }` or `{ value: "yes" }`
- Storage size: Negligible difference (primitives)
- Query performance: Identical (equality comparison)

### Type System Impact

**Compile-Time**:
- Validators: Full type safety for config properties
- Renderers: Must convert types at save boundary
- Consumers: Type narrowing via `typeof` check

**Runtime**:
- No performance impact (type checks removed, not added)
- Same Zod validation overhead as before
- String operations (String(), ternary) are trivial cost

### Developer Experience Impact

**Positive**:
- ✅ Full autocomplete for config properties
- ✅ Compile-time error detection
- ✅ Self-documenting code (types as documentation)
- ✅ Easier refactoring (compiler catches breaking changes)

**Neutral**:
- Type conversion at save boundary (minor verbosity)
- Type assertions in switch statements (standard pattern)

**No Negatives**: No meaningful downsides identified
