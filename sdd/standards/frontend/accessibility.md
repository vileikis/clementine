## Accessibility Best Practices

### Semantic HTML

Use appropriate HTML elements that convey meaning:

```typescript
// ✅ Semantic structure
<nav>
  <ul>
    <li><a href="/events">Events</a></li>
  </ul>
</nav>

<main>
  <h1>Event Name</h1>
  <section>
    <h2>Upload Photo</h2>
    <button type="submit">Submit</button>
  </section>
</main>

// ❌ Non-semantic
<div className="nav">
  <div onClick={handleClick}>Events</div>
</div>
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```typescript
// ✅ Keyboard accessible
<button onClick={handleClick}>Upload</button>
<a href="/event/123">View Event</a>

// ✅ Visible focus indicators (Tailwind)
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Submit
</Button>

// ❌ Non-keyboard accessible
<div onClick={handleClick}>Click me</div>
<a href="#" onClick={handleLink}>Link</a> // Use proper href or button
```

### Color Contrast

WCAG AA requirements:
- **Normal text (< 18px):** 4.5:1 contrast ratio
- **Large text (>= 18px):** 3:1 contrast ratio
- **UI components:** 3:1 contrast ratio

```typescript
// ✅ Good contrast (shadcn/ui defaults meet WCAG AA)
<div className="bg-background text-foreground">
  Content with good contrast
</div>

// ⚠️ Check custom color combinations
// Don't rely on color alone to convey information
<div className="text-red-500">Error</div>  // Also show icon or text
```

### Alternative Text

```typescript
// ✅ Descriptive alt text
<Image
  src={event.image}
  alt="Summer music festival with crowd dancing"
  width={800}
  height={600}
/>

// ✅ Empty alt for decorative images
<Image src="/decoration.svg" alt="" />

// ❌ Generic or missing alt
<img src={event.image} />
<img src={event.image} alt="image" />
```

### Form Labels

```typescript
// ✅ Proper labels
<label htmlFor="event-name">Event Name</label>
<input id="event-name" name="name" type="text" />

// ✅ Using shadcn/ui Form components (built-in labels)
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Event Name</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>

// ❌ Missing label
<input type="text" placeholder="Enter name" />
```

### ARIA Attributes (When Needed)

```typescript
// ✅ Use ARIA for complex components
<button
  aria-label="Close modal"
  aria-expanded={isOpen}
  aria-controls="menu"
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>

<div role="status" aria-live="polite">
  {uploadProgress}% uploaded
</div>

// ✅ Hide decorative elements from screen readers
<div aria-hidden="true">
  <Icon className="text-gray-400" />
</div>
```

### Heading Structure

Use logical heading hierarchy (h1 → h2 → h3):

```typescript
// ✅ Proper heading order
<h1>Event Dashboard</h1>
<section>
  <h2>Active Events</h2>
  <article>
    <h3>Summer Festival</h3>
  </article>
</section>

// ❌ Skip levels
<h1>Event Dashboard</h1>
<h3>Active Events</h3> // Skipped h2
```

### Focus Management

```typescript
// ✅ Manage focus in modals
import { useEffect, useRef } from 'react'

function Modal({ isOpen }: { isOpen: boolean }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef}>Close</button>
    </div>
  )
}
```

### Screen Reader Testing

**Test with:**
- **macOS:** VoiceOver (Cmd + F5)
- **Windows:** NVDA (free) or JAWS
- **Mobile:** iOS VoiceOver, Android TalkBack

**Key areas to test:**
- Form submissions
- Error messages
- Loading states
- Dynamic content updates
- Modal dialogs

### Best Practices

- **Semantic HTML first:** Use proper HTML elements
- **Keyboard accessible:** All interactions work with Tab/Enter/Space
- **Good contrast:** Meet WCAG AA standards (4.5:1 for text)
- **Descriptive labels:** All form inputs and images have labels/alt text
- **ARIA when needed:** Enhance complex components
- **Logical headings:** h1 → h2 → h3 in order
- **Focus management:** Handle focus in dynamic content
- **Test with screen readers:** Verify accessibility regularly

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)
- [shadcn/ui Accessibility](https://ui.shadcn.com/docs/components) (components are accessible by default)
