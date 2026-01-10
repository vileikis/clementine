# Contracts: Experience System Structural Foundations

**Feature Branch**: `020-exp-structural-foundations`
**Date**: 2026-01-10

## Overview

This phase (Phase 0) focuses on domain scaffolding and type definitions. There are no API contracts to define because:

1. This is a structural-only phase with no runtime functionality
2. All types are internal TypeScript definitions, not API contracts
3. Session API types already exist in the session domain

## Existing API Types

The session domain already defines the API shape for session operations:

```typescript
// From domains/session/shared/types/session-api.types.ts

type CreateSessionFn = (input: CreateSessionInput) => Promise<Session>
type SubscribeSessionFn = (sessionId: string, callback: (session: Session) => void) => () => void
type UpdateSessionProgressFn = (input: UpdateSessionProgressInput) => Promise<void>
type CloseSessionFn = (sessionId: string) => Promise<void>
```

These are function type signatures, not API endpoints. Implementation will be added in Phase 11 (Session Domain).

## Future API Contracts

API contracts will be defined in subsequent phases:

- **Phase 1**: Experience CRUD operations (Firestore, not REST)
- **Phase 11**: Session creation and management (Firestore, not REST)

Since this is a Firebase-first application using Firestore client SDK directly, traditional REST/GraphQL API contracts are not applicable. Data operations are defined through:

1. Firestore collection paths
2. Security rules
3. TypeScript function signatures

See `standards/global/client-first-architecture.md` for architectural details.
