# Accessibility Standards

Guidelines for building accessible user interfaces in the Clementine application.

## Overview

All UI components must be accessible to users with disabilities. We follow WCAG 2.1 Level AA standards.

## Core Principles

### 1. Semantic HTML

Use proper HTML elements for their intended purpose:

```tsx
// ✅ GOOD: Semantic HTML
<button onClick={handleClick}>Submit</button>
<nav><a href="/home">Home</a></nav>
<main><h1>Page Title</h1></main>

// ❌ BAD: Non-semantic HTML
<div onClick={handleClick}>Submit</div>
<div><span onClick={navigate}>Home</span></div>
<div><div>Page Title</div></div>
```

### 2. ARIA Attributes

Use ARIA when semantic HTML isn't enough:

```tsx
// When you need additional context
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

// For dynamic content
<div role="alert" aria-live="polite">
  {errorMessage}
</div>

// For complex widgets
<div
  role="tab"
  aria-selected={isSelected}
  aria-controls="panel-1"
  tabIndex={isSelected ? 0 : -1}
>
  Tab 1
</div>
```

### 3. Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
// ✅ Proper keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Custom Button
</div>
```

**Tab order:**
- Use `tabIndex={0}` for focusable elements
- Use `tabIndex={-1}` to remove from tab order
- Never use `tabIndex` > 0

### 4. Focus Management

Ensure visible focus indicators:

```tsx
// Tailwind focus utilities
<Button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</Button>
```

**Focus management patterns:**
- Trap focus in modals/dialogs (shadcn Dialog does this automatically)
- Return focus to trigger element when closing modals
- Move focus to newly revealed content

## Component Accessibility

### Buttons

```tsx
// ✅ Accessible button
<Button aria-label="Delete event" onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ Button with visible text (no aria-label needed)
<Button onClick={handleDelete}>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete Event
</Button>
```

### Forms

```tsx
// ✅ Accessible form
<form onSubmit={handleSubmit}>
  <div>
    <Label htmlFor="event-name">Event Name</Label>
    <Input
      id="event-name"
      type="text"
      aria-required="true"
      aria-invalid={!!errors.name}
      aria-describedby={errors.name ? 'name-error' : undefined}
    />
    {errors.name && (
      <p id="name-error" className="text-destructive text-sm">
        {errors.name}
      </p>
    )}
  </div>
</form>
```

### Modals/Dialogs

shadcn Dialog handles most accessibility automatically:

```tsx
import { Dialog, DialogContent, DialogTitle } from '@/ui-kit/components/dialog'

// ✅ Accessible dialog (shadcn handles focus trap, aria, etc.)
<Dialog>
  <DialogContent>
    <DialogTitle>Confirm Delete</DialogTitle>
    <p>Are you sure you want to delete this event?</p>
  </DialogContent>
</Dialog>
```

### Images

```tsx
// ✅ Meaningful images
<img src={event.image} alt={`Cover image for ${event.name}`} />

// ✅ Decorative images
<img src={decoration} alt="" role="presentation" />
```

## Testing Accessibility

### Keyboard Testing
1. Can you navigate to all interactive elements with Tab?
2. Can you activate elements with Enter/Space?
3. Can you see where focus is?
4. Can you close modals with Escape?

### Screen Reader Testing
- Test with NVDA (Windows) or VoiceOver (Mac)
- Ensure all content is announced correctly
- Check that interactive elements have proper labels

### Automated Testing
```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('component is accessible', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Common Patterns

### Skip Links

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">{children}</main>
```

### Screen Reader Only Text

```tsx
// Tailwind utility for screen-reader-only text
<span className="sr-only">Loading...</span>
<Loader className="animate-spin" />
```

### Accessible Icons

```tsx
// With visible text (no aria-label needed)
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Event
</Button>

// Icon only (needs aria-label)
<Button aria-label="Add event">
  <Plus className="h-4 w-4" />
</Button>
```

## Resources

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Testing Tools**: axe DevTools, WAVE, Lighthouse
- **shadcn/ui**: Built-in accessibility (use it!)

## Remember

- **shadcn/ui and Radix UI components are accessible by default** - don't break them!
- **Semantic HTML first**, ARIA when necessary
- **Keyboard navigation** is required, not optional
- **Test with actual assistive technology** when possible
