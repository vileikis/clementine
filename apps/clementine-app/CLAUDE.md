# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Clementine TanStack Start application.

## Project Overview

**Clementine** is a digital AI photobooth platform that empowers brands, event creators, and marketers to create stunning, AI-enhanced photo and video experiences without physical booths or technical skills.

### What We're Building

A web-based platform where:

- **Experience Creators** (brands/event organizers) set up AI-powered photo and video experiences with custom prompts and branding
- **Guests** visit a shareable link, upload a photo, and receive an AI-transformed result in under 1 minute
- **Analytics** help creators measure engagement, shares, and campaign success

### Project Status

This is a **complete rewrite** of the existing Next.js application (`web/`) using TanStack Start. The goal is to gradually build this application and make it the main production app, while the Next.js app will eventually be deprecated.

**Same scope, different tech stack.** We're not changing the product - we're modernizing the implementation.

## Development Standards

**IMPORTANT**: Before implementing any feature or making changes, you **MUST**:

1. **Read `standards/README.md`** to understand applicable standards
2. **Review `standards/global/project-structure.md`** for architecture and organization
3. **Follow all standards strictly** in your implementation

These standards are critical for maintaining consistency and code quality.

## Technical Stack

### Core Framework
- **TanStack Start** - Full-stack React framework
- **TanStack Router** - Type-safe routing with file-based routing
- **React 19** - Latest React with new features
- **TypeScript 5.7** - Strict mode enabled
- **Vite 7** - Build tool and dev server

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **lucide-react** - Icon library
- **class-variance-authority** - Component variants
- **tailwind-merge + clsx** - Conditional className utilities

### Data & State
- **TanStack Query** - Server state management
- **TanStack Router SSR Query** - SSR integration for queries

### Developer Experience
- **TanStack Router DevTools** - Route debugging
- **TanStack Query DevTools** - Query debugging
- **TanStack React DevTools** - React debugging
- **Sentry** - Error tracking and monitoring
- **Vitest** - Unit testing framework
- **TypeScript ESLint** - Linting
- **Prettier** - Code formatting

## Commands

Run all commands from **`apps/clementine-app/`** directory:

```bash
# Development
pnpm dev              # Start dev server (port 3000)

# Building & Running
pnpm build            # Build production app
pnpm start            # Start production server
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # TypeScript type checking
pnpm format           # Check Prettier formatting
pnpm check            # Format + fix linting (all-in-one)

# Testing
pnpm test             # Run tests with Vitest
```

## Architecture

### Project Structure

This project follows a **Domain-Driven Design (DDD)** influenced architecture. See `standards/global/project-structure.md` for full details.

```
src/
├── ui-kit/              # Design system (pure components)
├── integrations/        # Third-party integrations
├── shared/              # Shared utilities & components
├── domains/             # Business domains (DDD bounded contexts)
└── routes/              # TanStack Router routes (thin)
```

**Key Principles:**
- **Domain-first organization** - Code organized by business domains, not technical layers
- **Separation of concerns** - Clear boundaries between infrastructure, shared code, and domains
- **Thin routes** - Route files are minimal, importing containers from domains
- **Progressive complexity** - Start simple, add structure as needed

### TypeScript Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Button } from '@/ui-kit/components/Button'
import { firestore } from '@/integrations/firebase'
import { cn } from '@/shared/lib/cn'
import { EventsPage } from '@/domains/events/management/containers/EventsPage'
```

### TanStack Router

This project uses **file-based routing** with TanStack Router:

- Routes are defined in `src/routes/`
- Route files should be **thin** - primarily routing configuration
- Business logic and UI components belong in `domains/`
- Auto-generated route tree in `src/routeTree.gen.ts`

Example route pattern:

```tsx
// routes/admin/events/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { EventsPage } from '@/domains/events/management/containers/EventsPage'

export const Route = createFileRoute('/admin/events')({
  component: EventsPage,
  loader: async () => {
    // Data loading logic
  },
})
```

### Component Organization

Components are organized by domain in `src/domains/`:

```
domains/events/
├── management/          # Subdomain
│   ├── components/     # UI components
│   ├── containers/     # Page-level components (imported by routes)
│   ├── hooks/          # React hooks
│   ├── services/       # Business logic & API calls
│   └── types/          # TypeScript types
└── shared/             # Shared within events domain only
```

**Never** define components directly in route files. Always create them in the appropriate domain module.

## Development Workflow

### Starting a New Feature

1. **Identify the domain** - Which business domain does this belong to?
2. **Check existing structure** - Does the domain/subdomain exist?
3. **Create module structure** - Add folders as needed (components, containers, hooks, etc.)
4. **Build the feature** - Follow DDD principles and standards
5. **Create thin route** - Import container from domain module

### Working with Routes

1. **Create route file** in `src/routes/`
2. **Create container** in appropriate domain's `containers/` folder
3. **Import container** in route file
4. **Keep route minimal** - only routing config, loaders, params

### Adding UI Components

1. **Pure design system?** → Add to `ui-kit/components/`
2. **Shared business component?** → Add to `shared/components/`
3. **Domain-specific component?** → Add to `domains/{domain}/components/`

### Adding Utilities

1. **Generic utility (no business logic)?** → Add to `shared/lib/`
2. **Domain-specific utility?** → Add to `domains/{domain}/utils/`

## Integration with Firebase

This project will integrate with Firebase for:
- **Firestore** - Database
- **Firebase Storage** - Media storage
- **Firebase Auth** - Authentication (future)

Firebase configuration should be in `src/integrations/firebase/`.

## Best Practices

### Code Quality

- **TypeScript strict mode** - All type errors must be resolved
- **ESLint** - Fix all linting errors before committing
- **Prettier** - Code must be formatted (`pnpm check` before commit)
- **No console.log** - Use proper logging or remove debug statements

### Performance

- **Server-side rendering** - Leverage TanStack Start's SSR capabilities
- **Code splitting** - Use dynamic imports for large components
- **Query optimization** - Use TanStack Query for efficient data fetching
- **Image optimization** - Use proper image formats and lazy loading

### Accessibility

- **Semantic HTML** - Use proper HTML elements
- **ARIA attributes** - When semantic HTML isn't enough
- **Keyboard navigation** - All interactive elements accessible via keyboard
- **Focus management** - Clear focus indicators

### Security

- **Input validation** - Validate all user input
- **XSS prevention** - Sanitize user-generated content
- **CSRF protection** - Use proper CSRF tokens
- **Environment variables** - Never commit secrets to version control

## Testing

Tests are written using **Vitest** with **Testing Library**:

```tsx
// Example test
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

Run tests with: `pnpm test`

## Monitoring & Debugging

### Development Tools

- **TanStack Router DevTools** - Inspect routes, params, loaders
- **TanStack Query DevTools** - Monitor queries, mutations, cache
- **React DevTools** - Component tree and props inspection

### Error Tracking

- **Sentry** - Integrated for error tracking and performance monitoring
- Configuration in `src/integrations/sentry/`

## Migration from Next.js App

As we build this TanStack Start app, we'll gradually migrate features from the Next.js app (`web/`):

1. **Don't copy-paste** - Rewrite following new architecture
2. **Learn from patterns** - Study existing implementations but adapt to DDD structure
3. **Test thoroughly** - Ensure feature parity with Next.js app
4. **Document differences** - Note any behavioral changes

The Next.js app remains the reference implementation until this app is production-ready.

## Common Tasks

### Adding a New Domain

```bash
mkdir -p src/domains/new-domain/{components,containers,hooks,services,types}
```

### Adding a New Route

1. Create route file: `src/routes/path/to/route.tsx`
2. Create container: `src/domains/{domain}/containers/RoutePage.tsx`
3. Import in route file

### Installing Dependencies

From monorepo root:
```bash
pnpm add <package> --filter clementine-app
```

Or from app directory:
```bash
cd apps/clementine-app
pnpm add <package>
```

### Updating Types

After changing TypeScript types, run:
```bash
pnpm type-check
```

## Resources

- **TanStack Router Docs**: https://tanstack.com/router
- **TanStack Query Docs**: https://tanstack.com/query
- **TanStack Start Docs**: https://tanstack.com/start
- **Tailwind CSS Docs**: https://tailwindcss.com
- **Vitest Docs**: https://vitest.dev

## Getting Help

1. **Check standards** - Review relevant standards in `standards/`
2. **Check existing code** - Look for similar patterns in the codebase
3. **Review TanStack docs** - Official documentation is comprehensive
4. **Ask the team** - When in doubt, discuss with the team

Remember: **Consistency is key**. Follow established patterns and standards to maintain a high-quality, maintainable codebase.
