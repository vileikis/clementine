## CSS Best Practices (Tailwind CSS v4)

Clementine uses **Tailwind CSS v4** with CSS variables for theming.

### Tailwind Utility Classes

```typescript
// ✅ Use utility classes
<div className="flex items-center gap-4 px-4 py-2 bg-white rounded-lg shadow-sm">
  <span className="text-lg font-semibold">Event Name</span>
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '8px 16px' }}>
```

### Class Ordering with `cn()` Helper

Use the `cn()` utility from `@/lib/utils` for conditional classes:

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'flex items-center gap-2',  // Layout
  'px-4 py-2',                // Spacing
  'bg-white text-black',      // Colors
  'rounded-lg shadow-sm',     // Effects
  isActive && 'bg-primary',   // Conditional
  className                    // Override prop
)} />
```

### Theming with CSS Variables

Custom colors are defined in `app/globals.css` using CSS variables:

```typescript
// ✅ Use semantic color names
<div className="bg-background text-foreground" />
<Button variant="primary" />

// ❌ Avoid hardcoded colors for themed elements
<div className="bg-white text-black" /> // Only for truly fixed colors
```

### Responsive Design (Mobile-First)

```typescript
// ✅ Mobile-first approach
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Starts full width, adjusts for larger screens */}
</div>

// ❌ Desktop-first
<div className="w-1/3 md:w-1/2 sm:w-full">
```

### shadcn/ui Component Styling

```typescript
// ✅ Import from @/components/ui
import { Button } from '@/components/ui/button'

// ✅ Use variant prop for styling
<Button variant="default">Click me</Button>
<Button variant="outline">Secondary</Button>

// ✅ Extend with className when needed
<Button className="w-full">Full Width</Button>
```

### Custom CSS (Minimal)

Only use custom CSS when Tailwind utilities aren't sufficient:

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... */
  }
}

@layer utilities {
  /* Custom utilities only when truly needed */
  .gradient-hero {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
  }
}
```

### Performance

- Tailwind automatically purges unused styles in production
- Keep utility classes to avoid unnecessary bloat
- Avoid `@apply` directive (use utilities directly)

### Best Practices

- **Consistent methodology:** Tailwind utilities only
- **Work with the framework:** Don't fight Tailwind with overrides
- **Design tokens:** Use CSS variables for theming
- **Minimize custom CSS:** Leverage Tailwind and shadcn/ui
- **Purging:** Automatic in production build
