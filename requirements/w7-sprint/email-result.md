## Email Result Delivery

### 1) Problem

Guests who complete an AI photo experience have no way to receive their result directly — they must wait on the loading screen and manually download or share. If they leave the page, they lose access to the result.

### 2) Goal

While the AI transform is processing (loading screen), guests can optionally enter their email address to receive the result via email once it's ready. The email is sent from `info@clementine-labs.com` using Nodemailer + Google Workspace SMTP from a Cloud Function.

### 3) Non-goals (for v1)

- Email template builder / custom branding per project
- Email analytics (open rates, click rates)
- Bulk email / marketing campaigns
- Guest email collection for CRM purposes
- Email delivery status UI for creators
- Retry UI for failed email sends
- Email pre-fill across sessions (future: localStorage or guest document)

---

## UX: Guest loading screen

The email capture form appears within the `ShareLoadingRenderer` component — the screen guests see while the AI transform is processing.

### Loading visuals

Replace the current image skeleton with:

- **Themed spinner**: `Loader2` icon styled with `theme.primaryColor` (same approach as `ThemedLoading` primitive)
- **Elapsed time counter**: starts at `0s` when the loading screen mounts, counts up (`1s`, `2s`, ...) so guests see progress is happening

### Email capture form

Below the loading title, description, and elapsed counter:

- Heading: "Get your result by email" (configurable by creator)
- Email input field with placeholder "Enter your email"
- Submit button
- After submit: success confirmation replacing the form ("We'll send your result to you@example.com")

### Timing edge case

If the guest submits their email **after** the job has already completed (i.e., `jobStatus === 'completed'` and `resultMedia` exists on the session), the email should be sent immediately rather than waiting for a job completion trigger.

---

## UX: Creator configuration — Share Editor

The email capture feature is configurable per project from the Share Editor page (`ShareEditorPage.tsx`) under the **Loading** tab.

### Configuration options

- **Toggle**: Enable/disable "Get result by email" on the loading screen
- **Heading text**: Customizable heading (default: "Get your result by email")

This is managed alongside other `shareLoading` config fields.

---

## Email sending: Nodemailer + Google Workspace SMTP

All emails are sent using **Nodemailer** with Google Workspace SMTP. No other email service.

### SMTP configuration

- Host: `smtp.gmail.com`
- Port: `587` (TLS/STARTTLS)
- Auth: `info@clementine-labs.com` + App Password
- App Password stored as a Cloud Functions secret (not in code or .env)

### Why this approach

- No additional service signup — uses existing Google Workspace account
- Emails genuinely sent from `info@clementine-labs.com` (correct SPF/DKIM)
- Google Workspace limit of 2,000 emails/day is sufficient for photobooth volume
- Simple setup (~20 lines of transporter config)

---

## System behavior

### Two trigger points, one send function

Both paths call the same `sendResultEmail()` utility. The `emailSentAt` field on the session prevents duplicate sends.

**Trigger 1 — Job completes after email submitted:**

```
onDocumentUpdated(/projects/{projectId}/sessions/{sessionId})
  → if guestEmail exists
  → AND jobStatus just became 'completed'
  → AND resultMedia exists
  → AND emailSentAt is null
  → send email, set emailSentAt
```

**Trigger 2 — Email submitted after job already completed:**

```
onDocumentUpdated(/projects/{projectId}/sessions/{sessionId})
  → if guestEmail was just written
  → AND jobStatus === 'completed'
  → AND resultMedia exists
  → AND emailSentAt is null
  → send email, set emailSentAt
```

Both are the same `onDocumentUpdated` trigger — it fires on any session update, checks the conditions, and sends if all are met.

### Email content (v1 — simple)

- **From**: `info@clementine-labs.com`
- **Subject**: "Your result is ready!"
- **Body**: Simple HTML with a link/button to view/download the result image (using `resultMedia.url`)

---

## Data model changes

### Email storage: session only (v1)

Guest email is stored on the session document only. No pre-fill across sessions. Guest re-enters their email each time. This is the simplest approach and avoids complexity around kiosk mode (future) where a shared device shouldn't persist one person's email for the next.

### Session schema additions (`session.schema.ts`)

```
guestEmail: z.string().email().nullable().default(null)
emailSentAt: z.number().nullable().default(null)
```

### Share loading config additions

```
emailCapture: {
  enabled: boolean        // default: false
  heading: string         // default: "Get your result by email"
}
```

---

## Security considerations

- SMTP App Password stored as Firebase Cloud Functions secret (`defineSecret`)
- Guest email is PII — only store on the session, do not log
- Rate limiting: one email per session (enforced by `emailSentAt` guard)
- Email validation on both client (input type) and server (Zod schema)
