# Research: Strongly Typed Step Validation and Simplified Answer Schema

**Feature**: 051-step-validation-types
**Phase**: 0 (Outline & Research)
**Date**: 2026-01-31

## Research Questions

### Q1: How to implement discriminated union type narrowing for validators?

**Decision**: Use TypeScript discriminated union pattern with step.type as discriminator

**Rationale**:
- TypeScript's discriminated unions provide automatic type narrowing based on literal type field
- `ExperienceStepSchema` already uses discriminated union pattern with `step.type` as discriminator
- Each step config type is already defined in `@clementine/shared` package
- Pattern: Check `step.type`, then cast `config` to specific type

**Implementation approach**:
```typescript
// Before (loose typing)
function validateStepInput(step: ExperienceStep, input: unknown) {
  const config = step.config as StepConfig // Record<string, unknown>
  // No autocomplete, no type checking
}

// After (discriminated union with explicit typing)
function validateStepInput(step: ExperienceStep, input: unknown) {
  switch (step.type) {
    case 'input.scale':
      return validateScaleInput(
        step.config as ExperienceInputScaleStepConfig,
        input,
        (step.config as ExperienceInputScaleStepConfig).required
      )
    // ... other cases
  }
}

// Individual validators with specific types
function validateScaleInput(
  config: ExperienceInputScaleStepConfig,
  input: unknown,
  isRequired: boolean
): StepValidationResult {
  // Full autocomplete for config.min, config.max, etc.
}
```

**Alternatives considered**:
1. Type guards with `is` keyword - Rejected: More verbose, requires separate type guard functions
2. Generic validators with conditional types - Rejected: Over-engineered for this use case
3. Runtime type checking with Zod - Rejected: Config is already validated at schema level

**Trade-offs**:
- Explicit type casting in switch statement (minor verbosity)
- Benefit: Full type safety and autocomplete outweighs verbosity

---

### Q2: How to ensure answer value consistency across renderers?

**Decision**: Convert at save boundary in renderer components

**Rationale**:
- UI components naturally work with semantic types (boolean for yes/no, number for scale)
- Conversion should happen at the boundary where we call `onAnswer(value)`
- Single responsibility: UI layer handles interaction, save layer handles serialization

**Implementation approach**:
```typescript
// InputYesNoRenderer
const handleSelect = (value: boolean) => {
  if (mode === 'run' && onAnswer) {
    onAnswer(value ? 'yes' : 'no') // Convert boolean → string at boundary
  }
}

// InputScaleRenderer
const handleSelect = (value: number) => {
  if (mode === 'run' && onAnswer) {
    onAnswer(String(value)) // Convert number → string at boundary
  }
}
```

**Alternatives considered**:
1. Convert in runtime container - Rejected: Violates single responsibility, harder to test
2. Change UI to work with strings - Rejected: Unnatural for UI logic (buttons should have boolean state)
3. Keep multiple types, convert on read - Rejected: Type-specific handling everywhere

**Trade-offs**:
- Simple conversion logic (`String()`, ternary operator)
- UI layer still works with natural types
- Serialization concern isolated to save boundary

---

### Q3: How to handle backward compatibility with existing answer consumers?

**Decision**: No backward compatibility layer needed (pre-launch state)

**Rationale**:
- Project is pre-launch with no production session data
- All answer consumers are in same codebase and can be updated atomically
- Schema change is transparent to analytics counting/grouping operations

**Consumer update strategy**:
1. Identify all answer value consumers via code search
2. Update in same PR as schema change
3. Verify with type checking (TypeScript will catch incompatible usage)

**Known consumers**:
- Validators: Already handle `unknown` input type
- Analytics (future): Counting/grouping works identically with strings
- AI prompt generation: Strings are easier to interpolate
- Session runtime: Displays answer values (string display is identical)

**Alternatives considered**:
1. Normalization layer (convert old types to new) - Rejected: No old data exists
2. Gradual migration with feature flag - Rejected: Unnecessary complexity for pre-launch
3. Runtime type guards for safety - Rejected: TypeScript provides compile-time safety

**Migration plan**: N/A (no production data to migrate)

---

### Q4: What Zod schema patterns should be used for simplified answer value?

**Decision**: Replace union with simpler union, maintain existing schema structure

**Rationale**:
- Zod supports union types naturally with `z.union()`
- Existing `answerSchema` already uses union pattern
- Change is minimal: remove `z.number()` and `z.boolean()` from union
- Maintains backward compatibility with schema validation structure

**Implementation approach**:
```typescript
// Before
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]),
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})

// After
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([
    z.string(),
    z.array(z.string()),
  ]),
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})
```

**Alternatives considered**:
1. Discriminated union based on stepType - Rejected: Over-engineered, adds complexity
2. Separate schemas per step type - Rejected: Breaks existing generic answer handling
3. Keep union but add string coercion - Rejected: Doesn't solve type safety issue

**Validation behavior**:
- String values: Pass through unchanged
- String arrays: Pass through unchanged
- Invalid types: Zod validation fails at runtime (as expected)

---

### Q5: How to verify type safety improvements with TypeScript?

**Decision**: Use TypeScript compiler error checking and IDE autocomplete verification

**Rationale**:
- Type safety improvements are compile-time, not runtime
- Success criteria measure autocomplete and compile errors
- Verification approach: Intentionally introduce errors and verify compiler catches them

**Verification approach**:

1. **Autocomplete verification**:
   - Open validator file in IDE
   - Type `config.` and verify autocomplete shows correct properties
   - Document available properties per step type

2. **Type error verification**:
   - Access non-existent property (e.g., `config.invalidProp`)
   - Verify TypeScript shows error at compile-time
   - Verify error message is clear

3. **Wrong type verification**:
   - Pass wrong config type to validator
   - Verify TypeScript shows type mismatch error
   - Verify error pinpoints exact mismatch

**Testing strategy**:
- Unit tests verify validation logic (existing tests)
- Type checking verifies type safety (`pnpm app:type-check`)
- No runtime tests needed for type safety (compile-time guarantee)

**Alternatives considered**:
1. Runtime type assertions - Rejected: Defeats purpose of static typing
2. Integration tests - Rejected: Type safety is compile-time concern
3. Manual code review - Accepted as supplement, not replacement

---

## Technology Best Practices

### TypeScript Discriminated Unions

**Source**: TypeScript Handbook - Discriminated Unions

**Pattern**:
```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }

function area(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2 // shape.radius has full type info
    case 'square':
      return shape.side ** 2 // shape.side has full type info
  }
}
```

**Application to step validation**:
- Discriminator: `step.type` (literal types like 'input.scale', 'input.yesNo')
- Union members: Each ExperienceStepConfig type
- Type narrowing: Automatic in switch statement based on `step.type`

**Benefits**:
- Exhaustiveness checking (TypeScript errors if case missing)
- Automatic type narrowing (no manual type guards needed)
- IDE autocomplete within each case

---

### Zod Schema Evolution

**Source**: Zod documentation - Schema Evolution

**Best practices**:
1. Use `.optional()` for new fields (backward compatible)
2. Use `.default()` for required fields with sensible defaults
3. Avoid removing fields (breaking change)
4. Union type changes: Only narrow (remove types), don't widen (add types that weren't there)

**Application to answer schema**:
- Change: Narrowing union from 4 types to 2 types (safe change)
- No fields removed (schema structure unchanged)
- No new required fields (structure identical)
- Result: Schema remains backward compatible at structure level

**Migration considerations**:
- Pre-launch: No data to migrate
- Post-launch (hypothetical): Would need data migration for type change

---

### Firestore JSON Serialization

**Source**: Firebase documentation - Supported Data Types

**Firestore primitive types**:
- string ✅
- number ✅
- boolean ✅
- array ✅
- null ✅
- timestamp (special type)
- geopoint (special type)

**Serialization behavior**:
- JavaScript types are serialized to Firestore primitives automatically
- String "3" → Firestore string "3"
- Number 3 → Firestore number 3
- Boolean true → Firestore boolean true

**Impact on answer values**:
- Before: Mixed primitives (string, number, boolean, array)
- After: Consistent primitives (string, array only)
- Storage efficiency: Identical (all are Firestore primitives)
- Query behavior: Equality works the same for string "3" and number 3

**Best practice**: Use consistent types for fields that represent same concept (e.g., all answer values)

---

## Summary

All research questions resolved. Implementation approach is clear:

1. **Validators**: Use discriminated union with explicit config type casting per step type
2. **Renderers**: Convert at save boundary (UI uses natural types, save uses string format)
3. **Schema**: Simplify union to `string | string[]`, maintain existing structure
4. **Verification**: Use TypeScript compiler + IDE autocomplete to verify type safety
5. **Migration**: N/A (pre-launch, no production data)

No technical blockers identified. Ready to proceed to Phase 1 (Design & Contracts).
