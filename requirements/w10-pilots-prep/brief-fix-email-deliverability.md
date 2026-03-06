## Brief: Fix Email Deliverability (Emails Landing in Spam)

**Objective**
Ensure session result emails sent via `sendSessionEmailTask` reliably land in recipients' inboxes instead of spam folders.

**Problem**
All result emails sent to guests are arriving in the spam folder. The current setup uses direct SMTP via `smtp.gmail.com` from Firebase Cloud Functions with Nodemailer.

**Root Causes**
1. **Missing/misconfigured DNS authentication** — SPF, DKIM, and DMARC records for `clementine-labs.com` may be absent or incomplete.
2. **Shared SMTP IP reputation** — Sending through `smtp.gmail.com` from cloud infrastructure uses shared IPs with poor sender reputation.
3. **HTML-only emails** — No plain text fallback is provided, which is a spam signal for email clients.

**Acceptance Criteria**

- **DNS Authentication**: Verify and configure SPF, DKIM, and DMARC records for `clementine-labs.com`.
- **Plain Text Fallback**: Add a `text` field alongside `html` in the `sendMail` call in `email.service.ts`.
- **Evaluate Transactional Email Provider**: Assess switching from direct SMTP to a transactional email service (Resend, Postmark, or SendGrid) for better deliverability, IP reputation, and DKIM signing out of the box.
- **Verification**: Confirm emails land in inbox (not spam) for major providers (Gmail, Outlook, Yahoo).

**Technical Notes**
- Email service: `functions/src/services/email/email.service.ts`
- Task handler: `functions/src/tasks/sendSessionEmailTask.ts`
- Email template: `functions/src/services/email/templates/resultEmail.ts`
- Current sender: `info@clementine-labs.com` via Google Workspace SMTP
