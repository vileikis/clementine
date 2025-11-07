## Coding Style Best Practices

### TypeScript

#### Naming Conventions

- **Components:** PascalCase (`EventCard`, `UploadButton`)
- **Functions/Variables:** camelCase (`fetchEventData`, `isActive`)
- **Types/Interfaces:** PascalCase (`Event`, `UserProfile`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- **Files:** kebab-case for utilities, PascalCase for components
  - ✅ `utils/format-date.ts`, `components/EventCard.tsx`
  - ❌ `utils/FormatDate.ts`, `components/event-card.tsx`

#### Type Safety

- **Strict mode enabled:** All TypeScript strict checks enforced
- **No implicit any:** Explicitly define all types
- **Strict null checks:** Handle null/undefined explicitly
- **Prefer interfaces** for object shapes, **types** for unions/intersections

```typescript
// ✅ Good
interface Event {
  id: string
  name: string
  createdAt: Date
}

type Status = 'active' | 'inactive' | 'pending'

// ❌ Avoid
const data: any = fetchData()
```

### React Components

#### Structure

1. **Hooks** (useState, useEffect, custom hooks)
2. **Derived state** (computed values from props/state)
3. **Event handlers** (functions passed to child components)
4. **Render** (JSX return)

```typescript
export function EventCard({ event, onSelect }: EventCardProps) {
  // 1. Hooks
  const [isHovered, setIsHovered] = useState(false)

  // 2. Derived state
  const formattedDate = formatDate(event.createdAt)

  // 3. Event handlers
  const handleClick = () => onSelect?.(event.id)

  // 4. Render
  return <div onClick={handleClick}>...</div>
}
```

### Import Organization

1. External dependencies (React, Next.js)
2. Internal aliases (`@/components`, `@/lib`)
3. Relative imports

```typescript
// 1. External
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Internal aliases
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

// 3. Relative
import { EventCard } from './EventCard'
```

### Code Quality

- **Small, focused functions:** One clear purpose per function
- **Meaningful names:** Descriptive, intention-revealing names
- **Remove dead code:** Delete commented-out code (use git history)
- **DRY principle:** Extract common logic into reusable functions
- **No backward compatibility overhead:** Unless explicitly required

### Formatting

- **Automated formatting:** Prettier (recommended)
- **Consistent indentation:** 2 spaces (TypeScript/TSX)
- **Line length:** 80-100 characters (soft limit)
- **Semicolons:** Not required (Prettier handles this)
