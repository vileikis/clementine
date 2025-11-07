# Technical Standards & Conventions

This directory defines technical standards, conventions, and best practices for the Clementine codebase.

## Standards Documents

### [Code Style](./code-style.md)
Coding conventions, naming patterns, and formatting standards
- TypeScript configuration and best practices
- React component structure
- Next.js App Router conventions
- Tailwind CSS usage
- shadcn/ui component patterns
- Import organization
- Error handling

### [Architecture](./architecture.md)
System design patterns and structural guidelines
- Project structure and file organization
- Server vs Client component patterns
- Data flow and state management
- Component composition patterns
- API route design
- Mobile-first architecture
- Common anti-patterns to avoid

### [Testing](./testing.md)
Testing strategy, tools, and coverage requirements
- Testing philosophy and stack (Vitest, React Testing Library, Playwright)
- Unit, integration, and E2E testing patterns
- Component testing best practices
- Custom hook testing
- Coverage goals and CI/CD integration

### [Performance](./performance.md)
Performance budgets and optimization strategies
- Performance goals (< 60s AI, < 2s page load)
- Bundle size budgets
- Image optimization
- Code splitting strategies
- Caching patterns
- React performance optimization
- Monitoring and metrics

### [Security](./security.md)
Security guidelines and threat mitigation
- Authentication and authorization (Firebase Auth)
- Input validation and sanitization
- XSS and CSRF prevention
- File upload security
- Environment variable management
- Rate limiting
- Security headers and HTTPS

### [Documentation](./documentation.md)
Documentation practices and standards
- Code comment guidelines
- JSDoc for functions and types
- README structure
- API documentation
- Architectural Decision Records (ADRs)
- Changelog maintenance

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
