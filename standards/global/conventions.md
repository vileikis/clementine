## General Development Conventions

### Project Structure

**Monorepo organization:**

```
clementine/
├── web/                    # Next.js app
│   ├── src/app/           # App Router pages & API
│   ├── src/components/    # React components
│   ├── src/lib/          # Utilities
│   └── src/hooks/        # Custom hooks
├── functions/             # Firebase Cloud Functions
└── pnpm-workspace.yaml   # Workspace config
```

**File organization:**

- Group by feature/domain, not by type
- Co-locate related files (component + styles + tests)
- Use index files sparingly (explicit imports preferred)

### Version Control

#### Commit Messages

```
feat: add event creation form
fix: resolve image upload validation issue
docs: update API documentation
refactor: simplify event card component
perf: optimize image loading
test: add tests for event submission flow
```

#### Branch Strategy

- `main` - production-ready code
- `feature/[feature-name]` - new features
- `fix/[bug-description]` - bug fixes
- Short-lived branches (merge within 1-3 days)

#### Pull Requests

- Clear description of changes
- Reference related issues/specs
- Run tests and linting before PR
- Request review from relevant team members

### Environment Configuration

**Public variables** (exposed to browser):

```bash
NEXT_PUBLIC_API_URL=https://api.clementine.app
```

**Private variables** (server-only):

```bash
DATABASE_URL=postgresql://...
API_SECRET_KEY=...
FIREBASE_ADMIN_KEY=...
```

- Never commit `.env.local` or secrets
- Use `.env.example` for documenting required variables
- Validate env vars on app startup

### Dependency Management

- Use `pnpm` for package management (workspace monorepo)
- Keep dependencies minimal and up-to-date
- Run `pnpm audit` regularly for security vulnerabilities
- Document why major dependencies are added

### Testing Requirements

Before merging:

- Critical paths must have tests (event creation, photo upload)
- All tests must pass
- No TypeScript errors (`pnpm type-check`)
- No linting errors (`pnpm lint`)

### Documentation

- Update CHANGELOG.md for notable changes
- Keep README files current
- Document "why" in comments, not "what"
