# Development Standards

This directory contains development standards and best practices for the Clementine monorepo.

## Overview

These standards ensure consistency, maintainability, and quality across all workspaces. All developers and AI agents working on this project **MUST** read and follow these standards before making any changes.

**Philosophy:** Principles over prescriptions. Standards focus on "why" and best practices, with minimal code examples.

## Standards Organization

### `global/` - Cross-Cutting Concerns

**Always applicable** - standards that apply to all code, regardless of context.

| Standard | Description |
|----------|-------------|
| **[Code Quality](global/code-quality.md)** | TypeScript, ESLint, Prettier, strict mode |
| **[Coding Style](global/coding-style.md)** | Naming conventions, imports, formatting |
| **[Error Handling](global/error-handling.md)** | Type-safe errors, user messaging, logging |
| **[Security](global/security.md)** | Firebase security, authentication, input validation |
| **[Zod Validation](global/zod-validation.md)** | Schema validation, Firestore vs generic patterns |

### `frontend/` - TanStack Start Application

**UI/UX work** - standards for building the TanStack Start frontend.

| Standard | Description |
|----------|-------------|
| **[Architecture](frontend/architecture.md)** | Client-first Firebase approach, SSR strategy |
| **[Component Libraries](frontend/component-libraries.md)** | shadcn/ui, Radix UI, @dnd-kit usage |
| **[Routing](frontend/routing.md)** | TanStack Router patterns, file-based routing |
| **[State Management](frontend/state-management.md)** | Zustand, client state, server state separation |
| **[Accessibility](frontend/accessibility.md)** | WCAG 2.1 compliance, semantic HTML, ARIA |
| **[Performance](frontend/performance.md)** | SSR optimization, code splitting, lazy loading |

### `backend/` - Firebase Backend Services

**Backend work** - standards for Firestore and Cloud Functions.

| Standard | Description |
|----------|-------------|
| **[Firestore](backend/firestore.md)** | Collections, data model, queries, indexes |
| **[Firestore Security](backend/firestore-security.md)** | Security rules, access control patterns |
| **[Firebase Functions](backend/firebase-functions.md)** | Cloud Functions design, structure, media pipeline |

### `testing/` - Testing Practices

**Test implementation** - standards for writing tests across all workspaces.

| Standard | Description |
|----------|-------------|
| **[Testing](testing/testing.md)** | Vitest, Testing Library, mocking patterns |

## Quick Start

### Before Making Any Changes

1. **Identify your work area:**
   - Frontend feature? → Read `frontend/` standards
   - Backend API? → Read `backend/` standards
   - Testing? → Read `testing/testing.md`

2. **Always read `global/` standards:**
   - Code quality and style
   - Error handling
   - Validation patterns
   - Security principles

3. **Follow patterns strictly** - consistency is critical

### Quick Reference by Task

| Task | Standards to Review |
|------|---------------------|
| **New TanStack feature** | `frontend/architecture.md`, `frontend/routing.md`, `global/code-quality.md` |
| **UI components** | `frontend/component-libraries.md`, `frontend/accessibility.md` |
| **Firestore queries** | `backend/firestore.md`, `backend/firestore-security.md` |
| **Cloud Functions** | `backend/firebase-functions.md`, `global/error-handling.md` |
| **Form validation** | `global/zod-validation.md`, `global/error-handling.md` |
| **Writing tests** | `testing/testing.md` |
| **Code review** | `global/code-quality.md`, `global/security.md` |

## Core Principles

### 1. Client-First Architecture (Frontend)

- Firebase client SDKs for all data operations
- Real-time subscriptions with Firestore listeners
- Minimal server-side code
- Security enforced by Firebase rules

**See:** `frontend/architecture.md`

### 2. Domain-Driven Design (Frontend)

- Organize by business domain, not technical layer
- Thin app routes, thick domains
- Co-located components, hooks, and services

**See:** `global/project-structure.md` (in app-specific CLAUDE.md)

### 3. Type Safety Everywhere

- TypeScript strict mode enabled
- Zod validation for all inputs
- No `any` types
- Explicit error handling

**See:** `global/code-quality.md`, `global/zod-validation.md`

### 4. Firestore-Safe Patterns

- Use `.nullable().default(null)` for optional fields
- Never allow `undefined` values
- Use `passthrough()` for schema evolution
- Flat collection design

**See:** `global/zod-validation.md`, `backend/firestore.md`

### 5. Accessibility First

- WCAG 2.1 AA compliance
- Semantic HTML
- Keyboard navigation
- Screen reader support

**See:** `frontend/accessibility.md`

### 6. Testing for Confidence

- Vitest across all workspaces
- Test user behavior, not implementation
- Mock Firebase appropriately
- Meaningful test names

**See:** `testing/testing.md`

## Standards Evolution

These standards are living documents. As the project grows and we learn, standards will be updated to reflect best practices.

### Proposing Changes

1. Discuss with the team
2. Update relevant documentation
3. Ensure existing code still aligns (or plan refactor)
4. Update this README if adding new standards

### Version History

**v2.0.0** - 2024-12-26
- Reorganized for monorepo structure
- Added backend/ folder for Firestore and Functions
- Renamed validation.md → zod-validation.md with Firestore patterns
- Added coding-style.md and error-handling.md to global/
- Moved client-first-architecture.md → frontend/architecture.md
- Added routing.md and state-management.md to frontend/
- Renamed testing/overview.md → testing/testing.md with Vitest guidance
- Focus on principles over code examples

**v1.0.0** - 2024-12-23
- Initial standards for TanStack Start app

## Workspace-Specific Notes

### TanStack Start App (`apps/clementine-app/`)

**Primary application** - new development happens here.

**Key standards:**
- `frontend/` - All frontend standards apply
- `global/` - All global standards apply
- `testing/testing.md` - Vitest already configured

### Firebase Functions (`functions/`)

**Backend services** - AI processing, media pipeline.

**Key standards:**
- `backend/firebase-functions.md` - Function design patterns
- `backend/firestore.md` - Data access patterns
- `global/zod-validation.md` - Input validation
- `testing/testing.md` - Add Vitest for testing

## Frequently Asked Questions

### Why separate Firestore and Firestore Security?

- **firestore.md** - Data modeling, queries, client/admin SDK usage
- **firestore-security.md** - Security rules, access control, authentication

Different concerns, different audiences.

### Why Zod-specific validation standard?

Zod is used everywhere (frontend, backend, schemas). Having dedicated guidance ensures:
- Consistent patterns across workspaces
- Clear Firestore-safe vs generic TypeScript patterns
- Single source of truth for validation

### Do I need to read all standards?

No! Read based on your task:
- Always read relevant `global/` standards
- Read domain-specific standards (`frontend/`, `backend/`)
- Reference others as needed

### What if I disagree with a standard?

1. Discuss with the team
2. Propose alternative with rationale
3. Update standard if team agrees
4. Consistency > personal preference

## Getting Help

1. **Check standards** - Review relevant standards first
2. **Check existing code** - Look for similar patterns in the codebase
3. **Ask the team** - When in doubt, discuss with the team

## Remember

**Three golden rules:**

1. **Read before you code** - Check relevant standards first
2. **Consistency over cleverness** - Follow established patterns
3. **Principles over prescriptions** - Understand the "why", not just the "how"

**Consistency is key.** These standards exist to maintain a high-quality, maintainable codebase. When in doubt, follow the patterns you see in existing code.
