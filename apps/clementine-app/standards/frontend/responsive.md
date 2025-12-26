## Responsive Design Best Practices

**Clementine is mobile-first** - the primary experience is on mobile devices (320px - 768px).

### Tailwind Breakpoints

```typescript
// Mobile-first breakpoints (Tailwind default)
// sm: 640px   - Small tablets/large phones
// md: 768px   - Tablets
// lg: 1024px  - Small desktops
// xl: 1280px  - Large desktops
// 2xl: 1536px - Extra large screens

// ✅ Mobile-first approach
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-2/3">Main content</div>
  <div className="w-full md:w-1/3">Sidebar</div>
</div>

// ❌ Desktop-first
<div className="flex-row md:flex-col">
```

### Mobile-First Development

1. **Start with mobile** (320px - 768px)
2. **Enhance for tablet** (md: 768px+)
3. **Optimize for desktop** (lg: 1024px+)

```typescript
<div className="
  p-4           // Mobile: 16px padding
  md:p-6        // Tablet: 24px padding
  lg:p-8        // Desktop: 32px padding
">
  <h1 className="
    text-2xl    // Mobile: 24px
    md:text-3xl // Tablet: 30px
    lg:text-4xl // Desktop: 36px
  ">
    Event Title
  </h1>
</div>
```

### Touch-Friendly Design

Minimum tap target: **44x44px** (iOS/Android guidelines)

```typescript
// ✅ Touch-friendly buttons
<Button className="min-h-[44px] min-w-[44px] px-4 py-3">
  Upload Photo
</Button>

// ❌ Too small for mobile
<Button className="px-2 py-1 text-xs">
  Click
</Button>
```

### Fluid Layouts

```typescript
// ✅ Flexible containers
<div className="w-full max-w-7xl mx-auto px-4">
  {/* Content scales with viewport */}
</div>

// ✅ Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map(event => <EventCard key={event.id} event={event} />)}
</div>
```

### Content Priority

Show most important content first on mobile:

```typescript
function EventPage() {
  return (
    <>
      {/* Mobile: Photo upload is primary action */}
      <UploadSection className="order-1" />

      {/* Mobile: Event info below */}
      <EventInfo className="order-2" />

      {/* Desktop: Swap order with flexbox */}
      <div className="flex flex-col lg:flex-row-reverse">
        <UploadSection />
        <EventInfo />
      </div>
    </>
  )
}
```

### Readable Typography

```typescript
// Minimum font sizes (mobile)
<p className="text-base">    {/* 16px - body text */}
<p className="text-sm">      {/* 14px - secondary text */}
<h1 className="text-2xl">    {/* 24px - main headings */}

// Never go below 14px for readable text
// ❌ <p className="text-xs">  // 12px - too small for body text
```

### Image Optimization for Mobile

```typescript
import Image from 'next/image'

<Image
  src={event.image}
  alt={event.name}
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={85}
  priority={isAboveFold}
/>
```

### Testing Across Devices

**Test on real devices:**
- iPhone (various sizes)
- Android (various sizes)
- iPad/tablets
- Desktop browsers

**Use Chrome DevTools:**
- Toggle device toolbar (Cmd/Ctrl + Shift + M)
- Test common devices: iPhone 12/13/14, Pixel, iPad
- Test in both portrait and landscape

### Performance on Mobile

- Target 4G mobile connections (not just WiFi)
- Optimize images (WebP, responsive sizes)
- Bundle size < 200KB (gzipped)
- Lazy load below-the-fold content
- Test on throttled networks in DevTools

### Best Practices

- **Mobile-first always:** Design and code for mobile first
- **Standard breakpoints:** Use Tailwind's default breakpoints
- **Touch targets:** Minimum 44x44px for interactive elements
- **Content priority:** Most important content first on mobile
- **Test real devices:** Don't rely solely on DevTools
- **Performance matters:** Optimize for mobile networks
