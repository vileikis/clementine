# State Management

This document defines patterns for client-side state management in the TanStack Start application.

## Core Principles

### 1. Server State vs Client State
- **Server state:** Data from Firebase (use TanStack Query or Firestore listeners)
- **Client state:** UI state, form inputs, local preferences (use React state or Zustand)
- Don't mix the two

### 2. Minimal Client State
- Prefer server state (Firebase real-time) over caching
- Use client state only for UI-specific concerns
- Avoid duplicating server data in client state

### 3. Co-locate State
- Keep state close to where it's used
- Lift state only when necessary
- Avoid global state unless truly global

## State Categories

### Server State (Firebase)

**Use Firestore listeners for real-time data:**

```typescript
import { doc, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

function useEvent(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestore, 'events', eventId),
      (snapshot) => {
        setEvent(snapshot.data() as Event)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [eventId])

  return { event, loading }
}
```

**Or use TanStack Query for caching:**

```typescript
import { useQuery } from '@tanstack/react-query'

function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => fetchEvent(eventId),
  })
}
```

### Local Component State (React)

**Use `useState` for simple UI state:**

```typescript
function EventCard() {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button onClick={() => setIsExpanded(!isExpanded)}>Toggle</button>
      {isExpanded && <Details />}
    </div>
  )
}
```

### Global Client State (Zustand)

**Use Zustand for global UI state:**

```typescript
// shared/stores/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-store', // localStorage key
    }
  )
)

// In component
function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  return (
    <aside className={sidebarCollapsed ? 'collapsed' : ''}>
      <button onClick={toggleSidebar}>Toggle</button>
    </aside>
  )
}
```

## When to Use Each

| State Type | Use Case | Tool |
|------------|----------|------|
| **Server data** | Events, experiences, companies from Firestore | Firestore listeners or TanStack Query |
| **Form inputs** | Controlled form fields | `react-hook-form` or `useState` |
| **UI toggles** | Modals, dropdowns, tooltips | `useState` |
| **Global UI** | Sidebar state, theme, user preferences | Zustand with persist |
| **Shared component state** | Accordion groups, tab panels | Context API or lift state |

## Patterns

### Form State (react-hook-form)

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createEventSchema } from './schemas'

function EventForm() {
  const form = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: unknown) => {
    await createEvent(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && <span>Error</span>}
      <button type="submit">Create</button>
    </form>
  )
}
```

### Lifted State (Shared Between Components)

```typescript
function EventsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  return (
    <div>
      <EventList onSelect={setSelectedEventId} />
      <EventDetail eventId={selectedEventId} />
    </div>
  )
}
```

### Context for Deeply Nested State

```typescript
import { createContext, useContext, useState } from 'react'

interface ThemeContext {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContext | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

## Best Practices

### ✅ DO: Co-locate State

```typescript
// ✅ Good - state lives with component
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  return <div>{/* ... */}</div>
}

// ❌ Bad - global state for local UI
const useGlobalStore = create((set) => ({
  dropdownOpen: false,
  setDropdownOpen: (open: boolean) => set({ dropdownOpen: open }),
}))
```

### ✅ DO: Use Firestore Listeners for Real-Time

```typescript
// ✅ Good - real-time updates
useEffect(() => {
  return onSnapshot(doc(firestore, 'sessions', sessionId), (snapshot) => {
    setSession(snapshot.data())
  })
}, [sessionId])

// ❌ Bad - polling
useEffect(() => {
  const interval = setInterval(async () => {
    const session = await fetchSession(sessionId)
    setSession(session)
  }, 2000)
  return () => clearInterval(interval)
}, [sessionId])
```

### ✅ DO: Validate State Updates

```typescript
// ✅ Good - validated with Zod
const updateEvent = (input: unknown) => {
  const validated = updateEventSchema.parse(input)
  setEvent(validated)
}

// ❌ Bad - no validation
const updateEvent = (input: any) => {
  setEvent(input)
}
```

### ❌ DON'T: Duplicate Server Data

```typescript
// ❌ Bad - duplicating Firebase data in Zustand
const useStore = create((set) => ({
  events: [], // Server data cached locally
  setEvents: (events) => set({ events }),
}))

// ✅ Good - use Firestore listener or TanStack Query
function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  })
}
```

## Zustand Best Practices

### Slice Pattern for Large Stores

```typescript
// stores/slices/ui-slice.ts
export interface UiSlice {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
})

// stores/app-store.ts
export const useAppStore = create<UiSlice & OtherSlice>()((...a) => ({
  ...createUiSlice(...a),
  ...createOtherSlice(...a),
}))
```

### Persist Middleware

```typescript
import { persist } from 'zustand/middleware'

export const useStore = create()(
  persist(
    (set) => ({
      preferences: {},
      setPreferences: (prefs) => set({ preferences: prefs }),
    }),
    {
      name: 'app-preferences', // localStorage key
      partialize: (state) => ({ preferences: state.preferences }), // Only persist certain fields
    }
  )
)
```

## Quick Reference

```typescript
// Local UI state
const [open, setOpen] = useState(false)

// Firestore real-time
useEffect(() => onSnapshot(docRef, callback), [])

// TanStack Query
const { data } = useQuery({ queryKey, queryFn })

// Form state
const form = useForm({ resolver: zodResolver(schema) })

// Global UI state
const { collapsed, toggle } = useUiStore()

// Context
const value = useContext(MyContext)
```

## Resources

- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [react-hook-form](https://react-hook-form.com)
- [Firebase Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
