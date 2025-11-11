# Technical Standards & Conventions

This directory defines technical standards, conventions, and best practices for the Clementine codebase.

## Organization

Standards are organized by domain:

```
standards/
├── global/         # Cross-cutting standards
├── frontend/       # Frontend-specific standards
├── backend/        # Backend-specific standards
└── testing/        # Testing standards
```

## Global Standards

Cross-cutting standards that apply to the entire codebase.

### [Tech Stack](./global/tech-stack.md)
Complete technical stack definition
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- Backend: Firebase Cloud Functions, Firestore, n8n workflows
- Testing: Vitest, React Testing Library, Playwright
- Deployment: Vercel, GitHub Actions

### [Coding Style](./global/coding-style.md)
TypeScript, React, and general coding conventions
- Naming conventions (PascalCase, camelCase, UPPER_SNAKE_CASE)
- Type safety and strict mode
- React component structure
- Import organization
- Code quality principles

### [Conventions](./global/conventions.md)
Development workflow and project conventions
- Git workflow and commit messages
- Branch strategy
- Environment configuration
- Dependency management
- Spec-driven development workflow

### [Validation](./global/validation.md)
Input validation patterns
- Zod for type-safe validation
- Server-side validation (required)
- Client-side validation (for UX)
- File upload validation

### [Error Handling](./global/error-handling.md)
Error handling patterns
- Type-safe error handling
- React error boundaries
- API route error handling
- Loading and error states

### [Commenting](./global/commenting.md)
Code documentation guidelines
- When to comment (and when not to)
- JSDoc for public APIs
- TODO comments format
- Self-documenting code

## Frontend Standards

Standards specific to the web app (Next.js/React).

### [CSS](./frontend/css.md)
Tailwind CSS v4 usage and styling
- Utility classes and class ordering
- Theming with CSS variables
- Mobile-first responsive design
- shadcn/ui component styling

### [Responsive Design](./frontend/responsive.md)
Mobile-first design principles
- Tailwind breakpoints (mobile 320px-768px primary)
- Touch-friendly design (44x44px minimum)
- Content priority for mobile
- Performance on mobile networks

### [Accessibility](./frontend/accessibility.md)
WCAG AA accessibility standards
- Semantic HTML
- Keyboard navigation
- Color contrast (4.5:1 for text)
- Form labels and ARIA
- Screen reader testing

### [Components](./frontend/components.md)
React component best practices
- Component structure and organization
- Composition over configuration
- Server vs Client components
- State management patterns
- shadcn/ui integration

## Backend Standards

Standards for API routes and backend services.

### [Firebase](./backend/firebase.md)
Firebase architecture and best practices
- Hybrid Client SDK + Admin SDK pattern
- Client SDK for real-time subscriptions
- Admin SDK for mutations and business logic
- Security rules (allow reads, deny writes)
- Environment variables and configuration
- Data patterns and repository layer

### [API](./backend/api.md)
Next.js API route standards
- RESTful design patterns
- HTTP methods and status codes
- Query parameters and pagination
- Error responses
- Authentication (Firebase)
- Rate limiting

### [Models](./backend/models.md)
Data models and schemas (TBD)

### [Queries](./backend/queries.md)
Database query patterns (TBD)

### [Migrations](./backend/migrations.md)
Database migration strategies (TBD)

## Testing Standards

Testing philosophy, tools, and coverage requirements.

### [Test Writing](./testing/test-writing.md)
Unit, integration, and E2E testing
- Jest for unit/integration tests
- React Testing Library for components
- Playwright for E2E tests
- Coverage goals (70%+ overall, 90%+ critical paths)
- Test organization and best practices

## Current Stack

See [CLAUDE.md](../../CLAUDE.md) for current technical stack:
- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui components

## Creating Standards

When adding new standards:
1. Keep them practical and enforceable
2. Include examples (good and bad)
3. Explain the "why" behind each standard
4. Update this README with new standard files
