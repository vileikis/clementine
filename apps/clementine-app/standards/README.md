# Development Standards

This directory contains development standards and best practices for the Clementine TanStack Start application.

## 📋 Overview

These standards ensure consistency, maintainability, and quality across the codebase. All developers and AI agents working on this project **MUST** read and follow these standards before making any changes.

## 📁 Standards Organization

Standards are organized by scope:

### `global/`
**Always applicable** - standards that apply to all code, regardless of context.

- **[Project Structure](global/project-structure.md)** - Directory organization, DDD principles, module architecture

### `frontend/`
**UI/UX work** - standards for frontend development (coming soon).

- Component design patterns
- Styling conventions (Tailwind CSS)
- Accessibility guidelines
- Responsive design principles
- State management

### `testing/`
**Test implementation** - standards for writing tests (coming soon).

- Unit testing patterns
- Integration testing
- E2E testing with Playwright
- Test organization

## 🚀 Getting Started

### Before Making Any Changes

1. **Read `global/project-structure.md`** - Understand the architecture
2. **Review relevant standards** - Check standards for your task area
3. **Follow patterns strictly** - Consistency is critical

### Quick Reference

**Working on project structure?** → `global/project-structure.md`

**Building UI components?** → `frontend/` (coming soon)

**Writing tests?** → `testing/` (coming soon)

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
| **Frontend** | 📋 Planned | Component patterns, styling, accessibility |
| **Testing** | 📋 Planned | Test patterns and organization |

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
