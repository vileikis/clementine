## Code Commenting Best Practices

### When to Comment

✅ **Do comment:**
- Complex business logic
- Non-obvious workarounds
- Performance optimizations
- Security considerations
- TODOs and FIXMEs

```typescript
// ✅ Explains WHY
// Use debounce to avoid excessive API calls during rapid typing
const debouncedSearch = useDebouncedValue(searchQuery, 300)

// ✅ Explains TRADE-OFFS
// Client-side filtering is faster here because dataset is small (<100 items)
const filtered = events.filter(e => e.status === filter)

// ✅ Explains WORKAROUNDS
// FIXME: Temporary workaround for Safari backdrop-filter bug
// Remove when Safari 17+ reaches >90% usage
const styles = isSafari ? fallbackStyles : modernStyles
```

❌ **Don't comment:**
- Obvious code
- Redundant explanations
- Commented-out code (use git history)
- Changes or recent fixes (use commit messages)

```typescript
// ❌ Obvious
// Set name to the event name
const name = event.name

// ❌ Redundant
// This function adds two numbers
function add(a: number, b: number) {
  return a + b
}

// ❌ Dead code - delete it!
// const oldImplementation = () => { ... }
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new event with AI transformation settings
 *
 * @param data - Event creation data
 * @returns The created event with generated ID
 * @throws {ValidationError} If event data is invalid
 *
 * @example
 * ```typescript
 * const event = await createEvent({
 *   name: 'Summer Festival',
 *   prompt: 'Transform into summer vibes'
 * })
 * ```
 */
export async function createEvent(data: CreateEventInput): Promise<Event> {
  // Implementation
}
```

### TODO Comments

```typescript
// TODO: Add pagination when events exceed 100 items
// TODO(iggy): Implement caching strategy
// FIXME: Race condition with multiple uploads
// HACK: Workaround for library bug - remove when fixed
```

### Commenting Principles

- **Self-documenting code:** Clear names, simple logic
- **Explain "why", not "what":** Code shows what it does
- **Minimal and helpful:** Comments should add value
- **Evergreen content:** No temporary notes about changes
- **Use commit messages:** Document changes in git, not comments
