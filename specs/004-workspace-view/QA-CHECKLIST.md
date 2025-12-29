# QA Testing Checklist - Workspace View & Settings

**Feature**: 004-workspace-view
**Date**: 2025-12-29
**Tester**: **\*\***\_**\*\***
**Environment**: Local Dev Server (`pnpm dev`)

---

## Prerequisites

- [x] Dev server running at http://localhost:3000
- [x] Logged in as admin user (with `admin: true` custom claim)
- [x] At least 3 test workspaces exist with different names and slugs
- [x] All test workspaces have `status: 'active'`

---

## 🎯 User Story 1: View Workspace Context (P1 - MVP)

### Basic Navigation

- [x] Navigate to `/workspace/acme-corp` → Page loads successfully
- [x] Sidebar shows workspace icon (1-2 letters)
- [x] Sidebar shows workspace name
- [x] "Projects" and "Settings" links visible in sidebar

### Icon Generation

- [x] Two-word name (e.g., "Acme Corp") → Shows "AC"
- [x] Single-word name (e.g., "Single") → Shows "S"
- [x] Three-word name (e.g., "Acme Corp Inc") → Shows "AC"

### Error States

- [x] Navigate to `/workspace/invalid-slug` → Shows 404 page
- [x] 404 page shows "Workspace Not Found" title
- [x] 404 page has "View All Workspaces" button → links to `/admin/workspaces`

### Loading State

- [x] Throttle network to "Slow 3G" → Shows "Loading workspace..." message

---

## ⚙️ User Story 2: Edit Workspace Settings (P2)

### Access Settings

- [x] Click "Settings" in sidebar → URL changes to `/workspace/[slug]/settings`
- [x] Form shows "Workspace Settings" header
- [x] Name field is pre-filled with workspace name
- [x] Slug field is pre-filled with workspace slug
- [x] "Save Changes" button is disabled (no changes yet)

### Edit Name

- [x] Change workspace name → "Save Changes" button becomes enabled
- [x] Change workspace name → "Cancel" button appears
- [x] Click "Save Changes" → Button shows "Saving..."
- [x] Save completes → Sidebar updates with new name
- [x] Save completes → Workspace icon updates if needed

### Edit Slug

- [x] Change workspace slug → "Save Changes" button becomes enabled
- [x] Click "Save Changes" → URL redirects to new slug
- [x] New URL (`/workspace/new-slug/settings`) loads correctly
- [x] Old URL (`/workspace/old-slug`) now shows 404

### Edit Both Name and Slug

- [x] Change both name and slug → Both save successfully
- [x] URL redirects to new slug
- [x] Sidebar shows updated name

### Cancel Changes

- [x] Change workspace name → Click "Cancel" → Form resets to original values
- [x] After cancel → "Cancel" button disappears
- [x] After cancel → "Save Changes" button is disabled

### Validation - Name

- [x] Clear name field → Click "Save" → Shows "Name is required" error
- [x] Enter 101 characters → Click "Save" → Shows "must be 100 characters or less" error

### Validation - Slug

- [x] Enter "Invalid Slug!" → Shows "Invalid slug format" error
- [x] Enter "-invalid" → Shows "Invalid slug format" error
- [x] Enter "invalid-" → Shows "Invalid slug format" error
- [x] Enter "has spaces" → Shows "Invalid slug format" error

### Validation - Duplicate Slug

- [x] Have two workspaces: "workspace-a" and "workspace-b"
- [x] In workspace-a settings, change slug to "workspace-b"
- [x] Click "Save Changes" → Shows "Slug already in use" error
- [x] Form does not submit

---

## 💾 User Story 3: Remember Last Visited Workspace (P3)

### Session Persistence - Basic

- [x] Visit `/workspace/acme-corp`
- [x] Navigate to `/admin/workspaces`
- [x] Navigate to `/workspace` → Redirects to `/workspace/acme-corp`

### Session Persistence - Root

- [ ] Visit `/workspace/test-workspace`
- [ ] Navigate to `/` → Redirects to `/admin/workspaces` (not workspace)

WHY THIS SHOULD NOT NAVIGATE to /workspace/test-workspace ?

### Session Persistence - Browser Restart

- [x] Visit `/workspace/acme-corp`
- [x] Close browser completely
- [x] Reopen browser and log in
- [x] Navigate to `/workspace` → Redirects to `/workspace/acme-corp`

### Session Persistence - Clear Storage

- [x] Visit `/workspace/acme-corp`
- [x] Open DevTools → Application → Local Storage → Delete `workspace-storage`
- [x] Navigate to `/workspace` → Redirects to `/admin/workspaces`

### Session Persistence - Switch Workspaces

- [x] Visit `/workspace/workspace-a`
- [x] Visit `/workspace/workspace-b`
- [x] Navigate to `/workspace` → Redirects to `/workspace/workspace-b` (most recent)

### Session Persistence - After Slug Change

- [x] Visit `/workspace/old-slug`
- [x] Change slug to `new-slug` in settings
- [x] Navigate to `/workspace` → Redirects to `/workspace/new-slug`

---

## 📂 User Story 4: Projects Placeholder (P4)

- [x] Navigate to `/workspace/acme-corp`
- [x] Click "Projects" in sidebar → URL changes to `/workspace/acme-corp/projects`
- [x] Page shows "Projects" header
- [x] Page shows "Project management features coming soon" message
- [x] Sidebar maintains workspace context (name and icon)
- [x] Navigate directly to `/workspace/test-workspace/projects` → Page loads correctly

---

## 📱 Mobile Viewport Testing

### iPhone SE (375px)

- [x] Set viewport to 375px width in DevTools
- [x] Navigate to `/workspace/acme-corp` → Layout looks correct
- [x] All touch targets are at least 44x44px
- [x] No horizontal scrolling
- [x] Text is readable

### Mobile - Settings Form

- [x] Set viewport to 375px
- [x] Navigate to settings page
- [x] Form fields are tappable (not too small)
- [x] Edit name and slug → Keyboard doesn't obscure form
- [x] Save button is easily tappable
- [x] Error messages are readable

### Tablet (768px)

- [x] Set viewport to 768px width
- [x] Test navigation → Layout adapts appropriately
- [x] Test forms → All features remain accessible

---

## 🔒 Security Testing

### Non-Admin Access

- [x] Log out
- [x] Try to access `/workspace/acme-corp` → Redirects to `/login`
- [x] Cannot access workspace routes without admin auth

### XSS Prevention - Workspace Name

- [x] Create workspace with name: `<script>alert('XSS')</script>`
- [x] Navigate to workspace → Script does NOT execute
- [x] Name is safely displayed (no JavaScript runs)

### XSS Prevention - Slug

- [x] Try invalid slug: `"><script>alert(1)</script>`
- [x] Validation rejects it → Shows error
- [x] Cannot bypass validation

---

## ⚡ Performance Testing

### Workspace Load Time

- [ ] Open DevTools → Network tab
- [ ] Navigate to `/workspace/acme-corp`
- [ ] Workspace loads in < 2 seconds

### Update Speed

- [ ] Navigate to settings
- [ ] Change name → Click "Save Changes"
- [ ] Update completes in < 1 second

### Redirect Speed

- [ ] Navigate to `/workspace`
- [ ] Redirect completes in < 1 second
- [ ] No flashing or multiple redirects

---

## 🐛 Edge Cases

### Network Offline

- [ ] Navigate to workspace
- [ ] Go offline (DevTools → Network → Offline)
- [ ] Try to edit settings → Shows appropriate error
- [ ] Doesn't crash or freeze

### Special Characters

- [ ] Create workspace with name: `Acme & Co. — "Test"`
- [ ] Name displays correctly
- [ ] Icon generation handles special characters

### Very Long Name

- [ ] Create workspace with 100-character name
- [ ] View in sidebar → Name truncates gracefully
- [ ] Full name visible in settings/tooltip

### Rapid Navigation

- [ ] Quickly navigate between 3+ workspaces
- [ ] Use browser back/forward buttons rapidly
- [ ] Correct workspace always loads
- [ ] No stale data displayed

---

## ✅ Final Validation

- [ ] No console errors in any scenario
- [ ] All validation rules work correctly
- [ ] Session persistence works across browser restarts
- [ ] Mobile viewport (375px) is fully functional
- [ ] Security rules prevent unauthorized access
- [ ] Performance targets met (<2s load, <1s updates)
- [ ] Error messages are user-friendly
- [ ] 404 pages show correct content

---

## 📊 Test Summary

**Total Test Cases**: 80+

**Results**:

- Passed: **\_** / 80
- Failed: **\_** / 80
- Blocked: **\_** / 80

**Issues Found**:

1.
2.
3.

**Notes**:

**Sign-off**:

- [ ] All critical paths tested and working
- [ ] Feature is production-ready

**Tester**: **\*\***\_**\*\***
**Date**: **\*\***\_**\*\***
