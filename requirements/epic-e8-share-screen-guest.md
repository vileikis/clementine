# Epic E8: Share Screen Guest Integration

> **Epic Series:** Experience System
> **Dependencies:** E4 (Share Screen Editor), E7 (Guest Execution)
> **Enables:** None (final guest-facing epic)

---

## 1. Goal

Display the share screen to guests after completing an experience, enabling them to download and share their results.

**This epic delivers:**

- Share screen route (`/join/:projectId/share`)
- Result media display
- Download functionality
- Copy link functionality
- Social sharing integration
- CTA button actions

**This epic does NOT include:**

- Transform processing (E9)
- Analytics dashboards
- Advanced sharing options

---

## 2. Share Screen Route

### 2.1 Route: `/join/:projectId/share`

**Query Params:**
- `session` - Session ID with result media

### 2.2 Data Loading

```typescript
// 1. Load session to get resultAssetId
const session = useSession(sessionId)

// 2. Load event config for share screen settings
const event = usePublishedEvent(projectId)

// 3. Get result media URL
const resultUrl = session.resultUrl || session.capturedMedia[0]?.url
```

### 2.3 Validation

- Session must exist
- Session must be completed
- Result media must exist (capturedMedia or resultAssetId)

If validation fails, redirect to welcome.

---

## 3. Share Screen Layout

### 3.1 Run Mode

```
┌─────────────────────────────────────┐
│                                     │
│     ┌─────────────────────┐        │
│     │                     │        │
│     │   [Result Image]    │        │
│     │                     │        │
│     └─────────────────────┘        │
│                                     │
│       Your photo is ready!          │
│                                     │
│   Download or share your creation   │
│                                     │
│      [Create Another]               │
│                                     │
│   📥  🔗  📘  🐦  📱  ✉️            │
│                                     │
└─────────────────────────────────────┘
```

### 3.2 Component Props

```typescript
interface ShareScreenProps {
  mode: 'edit' | 'run'
  config: ShareScreenConfig
  sharing: SharingConfig
  resultUrl: string
  onDownload: () => void
  onCopyLink: () => void
  onShare: (platform: string) => void
  onCta: () => void
}
```

---

## 4. Download Functionality

### 4.1 Implementation

```typescript
async function handleDownload(resultUrl: string, quality: 'original' | 'optimized') {
  // 1. Fetch the image
  const response = await fetch(resultUrl)
  const blob = await response.blob()

  // 2. Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `photo-${Date.now()}.jpg`

  // 3. Trigger download
  link.click()
  URL.revokeObjectURL(url)
}
```

### 4.2 Quality Options

If `sharing.download.quality === 'optimized'`:
- Resize image to max 1920px
- Compress to ~80% quality

If `sharing.download.quality === 'original'`:
- Download as-is

---

## 5. Copy Link Functionality

### 5.1 Shareable Link

Generate unique shareable link:
```
https://app.clementine.com/share/{shareId}
```

### 5.2 Share Record

Create share record for link:

**Path:** `/projects/{projectId}/shares/{shareId}`

```typescript
{
  id: string
  projectId: string
  sessionId: string
  mediaUrl: string
  createdAt: number
  viewCount: number
}
```

### 5.3 Implementation

```typescript
async function handleCopyLink(sessionId: string) {
  // 1. Create or get share record
  const share = await getOrCreateShare(sessionId)

  // 2. Copy to clipboard
  await navigator.clipboard.writeText(share.url)

  // 3. Show toast
  toast.success('Link copied!')
}
```

---

## 6. Social Sharing

### 6.1 Supported Platforms

| Platform | Method | URL Template |
|----------|--------|--------------|
| Facebook | Share dialog | `https://www.facebook.com/sharer/sharer.php?u={url}` |
| Twitter | Intent | `https://twitter.com/intent/tweet?url={url}&text={text}` |
| WhatsApp | API | `https://wa.me/?text={text} {url}` |
| Email | mailto | `mailto:?subject={subject}&body={body}` |

### 6.2 Instagram Note

Instagram doesn't support direct URL sharing. Options:
- "Save to share on Instagram" prompt
- Deep link to Instagram app (limited)

### 6.3 Implementation

```typescript
function handleShare(platform: string, shareUrl: string, title: string) {
  const shareText = `Check out my photo from ${title}!`

  const urls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
  }

  window.open(urls[platform], '_blank', 'width=600,height=400')
}
```

---

## 7. CTA Button

### 7.1 Actions

| Action | Behavior |
|--------|----------|
| `restart` | Navigate back to welcome screen |
| `external` | Open configured URL in new tab |

### 7.2 Implementation

```typescript
function handleCta(config: ShareScreenConfig['cta']) {
  if (!config) return

  if (config.action === 'restart') {
    navigate(`/join/${projectId}`)
  } else if (config.action === 'external' && config.url) {
    window.open(config.url, '_blank')
  }
}
```

---

## 8. Share Page Route

### 8.1 Public Share View

**Route:** `/share/:shareId`

Displays shared result to anyone with the link:

```
┌─────────────────────────────────────┐
│                                     │
│     ┌─────────────────────┐        │
│     │                     │        │
│     │   [Shared Image]    │        │
│     │                     │        │
│     └─────────────────────┘        │
│                                     │
│     Created with Clementine         │
│                                     │
│     [Create Your Own →]             │
│                                     │
└─────────────────────────────────────┘
```

### 8.2 View Tracking

Increment `viewCount` on share record when viewed.

---

## 9. Theming

### 9.1 Apply Event Theme

Share screen respects event theme:
- Background color
- Text colors
- Button styles
- Font family

### 9.2 Sharing Icons

Use platform brand colors for sharing icons:
- Facebook: #1877F2
- Twitter: #1DA1F2
- WhatsApp: #25D366
- Email: neutral

---

## 10. Implementation Phases

### Phase 1: Share Screen Route

Create share route with session/config loading and result display.

### Phase 2: Download

Implement download with quality options.

### Phase 3: Copy Link

Create share records and clipboard copy functionality.

### Phase 4: Social Sharing

Implement social platform sharing buttons.

### Phase 5: Public Share Page

Build public share view route with view tracking.

---

## 11. Acceptance Criteria

### Must Have

- [ ] Share screen displays after experience completion
- [ ] Result image/media displays correctly
- [ ] Title and description from config shown
- [ ] Download button saves image to device
- [ ] Copy link creates shareable URL
- [ ] Social sharing opens correct platform dialogs
- [ ] Only enabled sharing options shown
- [ ] CTA button works (restart or external)
- [ ] Theme applied to share screen

### Nice to Have

- [ ] View count on shared links
- [ ] Share analytics
- [ ] Custom OG meta tags for shared links
- [ ] QR code for sharing

---

## 12. Technical Notes

### Folder Structure

```
domains/guest/
├── containers/
│   └── SharePage.tsx
├── components/
│   ├── ShareScreen.tsx           # Shared with E4 preview
│   ├── ResultDisplay.tsx
│   ├── SharingButtons.tsx
│   └── CtaButton.tsx
├── hooks/
│   ├── useShareRecord.ts
│   └── useDownload.ts
└── index.ts

app/
├── guest/
│   └── join/
│       └── $projectId/
│           └── share.tsx
└── share/
    └── $shareId.tsx              # Public share view
```

### Security

Share records readable by anyone (public links).
Session data NOT exposed via share - only media URL.

---

## 13. Out of Scope

| Item | Epic |
|------|------|
| Transform results | E9 |
| Video/GIF sharing | Future |
| Advanced analytics | Future |
| Custom OG images | Future |
