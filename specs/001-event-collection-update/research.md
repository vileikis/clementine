# Research: Event Collection Schema Refactor

**Feature**: 001-event-collection-update
**Date**: 2025-11-19
**Status**: Complete

## Overview

This document captures research findings and architectural decisions for refactoring the Event Firestore schema from flat prefixed fields to nested semantic objects.

## Research Areas

### 1. Firestore Nested Object Support

**Question**: Can Firestore store and query nested objects efficiently? What are the limitations?

**Decision**: Use nested objects for Event schema

**Rationale**:
- Firestore natively supports nested objects (maps) as field values
- Nested objects are indexed automatically—no performance penalty for reads
- Queries can target nested fields using dot notation: `where("welcome.title", "==", "value")`
- Updates support dot notation for partial updates: `update({ "welcome.title": "new value" })`
- Firestore has a 20MB document size limit—nested objects for Event schema are well within this limit (< 1KB typically)

**Alternatives Considered**:
- **Subcollections**: Would require separate reads, adding latency. Rejected because welcome/ending/share/theme are tightly coupled to Event and should load atomically.
- **Flat prefixed fields** (current): Poor developer experience, naming clutter, harder to validate as cohesive units. This is what we're refactoring away from.

**References**:
- [Firestore Data Model - Maps](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types)
- [Firestore Queries - Nested Fields](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)

---

### 2. Zod Schema Design for Nested Objects

**Question**: How should Zod schemas be structured for nested Event objects? Should we define separate schemas or inline them?

**Decision**: Define separate Zod schemas for each nested object (`EventTheme`, `EventWelcome`, `EventEnding`, `EventShareConfig`) and compose them in the main `Event` schema

**Rationale**:
- **Reusability**: Separate schemas can be imported and used independently for validation in Server Actions (e.g., `updateEventWelcomeSchema` uses `EventWelcome`)
- **Type Inference**: TypeScript can infer types for nested objects: `type EventWelcome = z.infer<typeof eventWelcomeSchema>`
- **Modularity**: Each schema can be tested independently and versioned
- **Validation Clarity**: Validation errors point to specific nested schemas (e.g., "EventWelcome.title is too long")

**Alternatives Considered**:
- **Inline nested schemas**: Would reduce modularity and make Server Action validation schemas harder to compose. Rejected for poor maintainability.
- **Single monolithic schema**: Would make validation logic harder to test and reuse. Rejected for same reason as inline.

**Implementation Pattern**:
```typescript
// Separate schemas for nested objects
export const eventWelcomeSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  backgroundImage: z.string().url().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const eventThemeSchema = z.object({
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  buttonTextColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundImage: z.string().url().optional(),
});

// Compose into main Event schema
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  // ... other fields
  welcome: eventWelcomeSchema.optional(),
  theme: eventThemeSchema.optional(),
});
```

**References**:
- [Zod - Object Schemas](https://zod.dev/?id=objects)
- [Zod - Type Inference](https://zod.dev/?id=type-inference)

---

### 3. Firestore Security Rules for Nested Objects

**Question**: How do Firestore security rules validate nested objects? Can we deny writes to deprecated fields?

**Decision**: Use Firestore security rules to validate nested object structure and explicitly deny writes containing deprecated field keys

**Rationale**:
- Security rules can access nested fields via dot notation: `request.resource.data.welcome.title`
- Rules can check for presence of deprecated keys using `request.resource.data.keys().hasAny(['brandColor', 'showTitleOverlay'])`
- Denying deprecated fields prevents accidental writes from legacy code or manual Firestore console edits
- Server-side validation (Zod in Server Actions) is first line of defense; Firestore rules are second layer

**Alternatives Considered**:
- **No Firestore rule enforcement**: Rely only on Server Action validation. Rejected because manual Firestore edits or bugs could still write deprecated fields.

**Implementation Pattern**:
```javascript
// firestore.rules
match /events/{eventId} {
  allow read: if true; // Public read access

  allow write: if
    // Deny if deprecated fields are present
    !request.resource.data.keys().hasAny([
      'brandColor', 'showTitleOverlay',
      'surveyEnabled', 'surveyRequired', 'surveyStepsCount', 'surveyStepsOrder', 'surveyVersion',
      'welcomeTitle', 'welcomeDescription', 'welcomeCtaLabel', 'welcomeBackgroundImagePath', 'welcomeBackgroundColorHex',
      'endHeadline', 'endBody', 'endCtaLabel', 'endCtaUrl',
      'shareAllowDownload', 'shareAllowSystemShare', 'shareAllowEmail', 'shareSocials'
    ]) &&
    // Validate nested object structure
    (
      !request.resource.data.keys().hasAny(['welcome']) ||
      (request.resource.data.welcome.keys().hasAll(['title', 'body', 'ctaLabel', 'backgroundImage', 'backgroundColor']) == false)
    );
}
```

**References**:
- [Firestore Security Rules - Data Validation](https://firebase.google.com/docs/firestore/security/rules-conditions#data_validation)
- [Firestore Security Rules - keys()](https://firebase.google.com/docs/reference/security/database#keys)

---

### 4. Migration Strategy for Existing Events

**Question**: How should existing events with legacy prefixed fields be handled? Should we migrate them automatically?

**Decision**: No automatic data migration. Event Designer will read/write only new nested structure. Legacy events remain unchanged in Firestore until edited through Event Designer.

**Rationale**:
- **Spec requirement**: Feature specification explicitly states "No need to add any data migrations of existing data in firestore."
- **Risk reduction**: No migration means no risk of data loss or corruption from bulk updates
- **Natural migration**: As creators edit events through the Event Designer, data will naturally migrate to new structure
- **Firestore reads are free**: Existing events with legacy fields will still load fine (fields are just ignored by UI)

**Handling Strategy**:
1. **Read**: Event Designer components ignore legacy prefixed fields, only read from nested objects
2. **Write**: Server Actions write only to nested objects, never touch legacy fields
3. **Default values**: If nested object is undefined, use sensible defaults (e.g., empty strings, default colors)
4. **Coexistence**: Legacy and new fields can coexist temporarily—new fields take precedence in UI

**Alternatives Considered**:
- **Bulk migration script**: Could migrate all existing events at once. Rejected due to spec requirement and risk of data corruption.
- **On-read migration**: Migrate legacy data to new structure when event is loaded. Rejected because it would cause unexpected writes without user action.

---

### 5. TypeScript Type Safety for Nested Objects

**Question**: How do we ensure type safety when accessing nested object properties (e.g., `event.welcome.title`) to avoid runtime errors?

**Decision**: Use TypeScript optional chaining (`?.`) and nullish coalescing (`??`) when accessing nested fields. Define strict TypeScript interfaces that match Zod schemas.

**Rationale**:
- **Runtime safety**: Optional chaining prevents `Cannot read property 'title' of undefined` errors
- **Type inference**: TypeScript infers correct types from Zod schemas via `z.infer<typeof schema>`
- **Compile-time checks**: TypeScript strict mode catches missing null checks at compile time
- **Consistency**: All nested object access follows same pattern: `event.welcome?.title ?? ""`

**Implementation Pattern**:
```typescript
// Type inference from Zod
export type Event = z.infer<typeof eventSchema>;
export type EventWelcome = z.infer<typeof eventWelcomeSchema>;

// Component usage with optional chaining
function WelcomeEditor({ event }: { event: Event }) {
  const [title, setTitle] = useState(event.welcome?.title ?? "");
  const [body, setBody] = useState(event.welcome?.body ?? "");

  // TypeScript knows `event.welcome` is `EventWelcome | undefined`
  // and `event.welcome.title` is `string | undefined`
}
```

**Alternatives Considered**:
- **Required nested objects**: Make `welcome`, `ending`, `share`, `theme` required fields. Rejected because existing events may not have these fields, and not all events need all screens (e.g., theme is optional).
- **Default object initialization**: Always initialize nested objects to empty objects `{}`. Rejected because it pollutes Firestore with empty objects and makes it harder to distinguish "not configured" from "configured but empty".

**References**:
- [TypeScript - Optional Chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)
- [TypeScript - Nullish Coalescing](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing)

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Firestore Schema** | Use nested objects (maps) for Event schema | Native Firestore support, efficient reads, dot notation queries |
| **Zod Schemas** | Separate schemas for each nested object, composed in main schema | Reusability, modularity, clear validation errors |
| **Security Rules** | Deny deprecated fields, validate nested structure | Defense in depth, prevents manual edits breaking schema |
| **Migration** | No automatic migration; natural migration via Event Designer edits | Per spec requirement, reduces risk, legacy data harmless |
| **Type Safety** | Optional chaining + nullish coalescing for all nested access | Prevents runtime errors, strict TypeScript compliance |

---

## Open Questions

None. All technical decisions finalized and documented above.

---

## Next Steps

Proceed to **Phase 1: Design & Contracts** to:
1. Generate `data-model.md` with full Event schema definition
2. Generate Server Action contracts in `/contracts/`
3. Generate `quickstart.md` for developers implementing this feature
