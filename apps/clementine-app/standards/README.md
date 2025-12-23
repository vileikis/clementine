# Development Standards

This directory contains development standards and best practices for the Clementine TanStack Start application.

## 📋 Overview

These standards ensure consistency, maintainability, and quality across the codebase. All developers and AI agents working on this project **MUST** read and follow these standards before making any changes.

## 📁 Standards Organization

Standards are organized by scope:

### `global/`
**Always applicable** - standards that apply to all code, regardless of context.

- **[Project Structure](global/project-structure.md)** - Directory organization, DDD principles, module architecture
- **[Client-First Architecture](global/client-first-architecture.md)** - Firebase client SDK usage, SSR strategy, security model
- **[Code Quality](global/code-quality.md)** - TypeScript, ESLint, Prettier, code style conventions
- **[Security](global/security.md)** - Firebase security rules, authentication, input validation

### `frontend/`
**UI/UX work** - standards for frontend development.

- **[Component Libraries](frontend/component-libraries.md)** - shadcn/ui, Radix UI, @dnd-kit usage and patterns
- **[Accessibility](frontend/accessibility.md)** - WCAG 2.1 compliance, semantic HTML, ARIA, keyboard navigation
- **[Performance](frontend/performance.md)** - SSR optimization, code splitting, TanStack Query, image optimization

### `testing/`
**Test implementation** - standards for writing tests.

- **[Testing Overview](testing/overview.md)** - Vitest, Testing Library, component tests, mocking patterns

## 🚀 Getting Started

### Before Making Any Changes

1. **Read `global/project-structure.md`** - Understand the architecture
2. **Review relevant standards** - Check standards for your task area
3. **Follow patterns strictly** - Consistency is critical

### Quick Reference

**Working on architecture?** → `global/project-structure.md` + `global/client-first-architecture.md`

**Building UI components?** → `frontend/component-libraries.md` + `frontend/accessibility.md`

**Optimizing performance?** → `frontend/performance.md`

**Writing tests?** → `testing/overview.md`

**Code review checklist?** → `global/code-quality.md` + `global/security.md`

## 🎯 Core Principles

### 1. Domain-Driven Design
- Organize code by business domains, not technical layers
- Minimize cross-domain dependencies
- Use clear, domain-specific language

### 2. Separation of Concerns
- `ui-kit/` - Pure design system
- `integrations/` - Third-party services
- `shared/` - Shared utilities
- `domains/` - Business logic
- `routes/` - Thin routing layer

### 3. Progressive Complexity
- Start simple, add structure as needed
- Don't create abstractions for one-off code
- Only extract to `shared/` when used by 2+ domains

### 4. Explicit Over Implicit
- Clear import paths with TypeScript aliases
- Explicit dependencies
- Well-named files and folders

## 📚 Standards Status

| Standard | Status | Description |
|----------|--------|-------------|
| **Project Structure** | ✅ Complete | Directory organization and DDD principles |
| **Client-First Architecture** | ✅ Complete | Firebase client SDK, SSR strategy, security model |
| **Code Quality** | ✅ Complete | TypeScript, ESLint, Prettier, conventions |
| **Security** | ✅ Complete | Firebase rules, auth, input validation |
| **Component Libraries** | ✅ Complete | shadcn/ui, Radix UI, @dnd-kit patterns |
| **Accessibility** | ✅ Complete | WCAG compliance, semantic HTML, ARIA |
| **Performance** | ✅ Complete | SSR, code splitting, optimization |
| **Testing** | ✅ Complete | Vitest, Testing Library, mocking |

## 🔄 Standards Evolution

These standards are living documents. As the project grows and we learn, standards will be updated to reflect best practices.

### Updating Standards

When proposing changes to standards:
1. Discuss with the team
2. Update relevant documentation
3. Ensure existing code still aligns (or refactor)
4. Update this README if adding new standards

## ❓ Questions?

If you're unsure about how to apply these standards:
1. Check existing code for patterns
2. Review the specific standard in detail
3. Ask the team for clarification

Remember: **Consistency is more important than perfection.** When in doubt, follow existing patterns.
