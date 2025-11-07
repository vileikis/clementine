# Project Specifications

This directory contains specifications for individual projects and features following the spec-driven development workflow.

## Structure

Each project/feature gets its own subdirectory:

```
specs/
├── [project-name]/
│   ├── spec.md        # Specification (what & why)
│   ├── plan.md        # Technical plan (how)
│   ├── tasks.md       # Task breakdown
│   └── [other-docs]   # Additional documentation
```

## Workflow

Use the spec-driven development commands:

1. **`/specify`** - Create `spec.md` defining what and why
2. **`/plan`** - Create `plan.md` with technical approach
3. **`/tasks`** - Generate `tasks.md` with actionable tasks
4. **`/build`** - Implement tasks systematically
5. **`/review`** - Review implementation against spec/plan

## Best Practices

- One project per directory
- Keep specs focused and scoped
- Update documents as requirements evolve
- Reference product docs (`../product/`) and standards (`../standards/`)
- Include diagrams, mockups, or examples when helpful

## Example Projects

(Add links to example specs here as they're created)
