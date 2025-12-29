# QA Testing Checklist - Workspace View & Settings

**Feature**: 004-workspace-view
**Date**: 2025-12-29
**Tester**: ******\_******
**Environment**: Local Dev Server (`pnpm dev`)

---

## Prerequisites

- [ ] Dev server running at http://localhost:3000
- [ ] Logged in as admin user (with `admin: true` custom claim)
- [ ] At least 3 test workspaces exist with different names and slugs
- [ ] All test workspaces have `status: 'active'`

---

## 🎯 User Story 1: View Workspace Context (P1 - MVP)

### Basic Navigation

- [ ] Navigate to `/workspace/acme-corp` → Page loads successfully
- [ ] Sidebar shows workspace icon (1-2 letters)
- [ ] Sidebar shows workspace name
- [ ] "Projects" and "Settings" links visible in sidebar

### Icon Generation

- [ ] Two-word name (e.g., "Acme Corp") → Shows "AC"
- [ ] Single-word name (e.g., "Single") → Shows "S"
- [ ] Three-word name (e.g., "Acme Corp Inc") → Shows "AC"

### Error States

- [ ] Navigate to `/workspace/invalid-slug` → Shows 404 page
- [ ] 404 page shows "Workspace Not Found" title
- [ ] 404 page has "View All Workspaces" button → links to `/admin/workspaces`

### Loading State

- [ ] Throttle network to "Slow 3G" → Shows "Loading workspace..." message

---

## ⚙️ User Story 2: Edit Workspace Settings (P2)

### Access Settings

- [ ] Click "Settings" in sidebar → URL changes to `/workspace/[slug]/settings`
- [ ] Form shows "Workspace Settings" header
- [ ] Name field is pre-filled with workspace name
- [ ] Slug field is pre-filled with workspace slug
- [ ] "Save Changes" button is disabled (no changes yet)

### Edit Name

- [ ] Change workspace name → "Save Changes" button becomes enabled
- [ ] Change workspace name → "Cancel" button appears
- [ ] Click "Save Changes" → Button shows "Saving..."
- [ ] Save completes → Sidebar updates with new name
- [ ] Save completes → Workspace icon updates if needed

### Edit Slug

- [ ] Change workspace slug → "Save Changes" button becomes enabled
- [ ] Click "Save Changes" → URL redirects to new slug
- [ ] New URL (`/workspace/new-slug/settings`) loads correctly
- [ ] Old URL (`/workspace/old-slug`) now shows 404

### Edit Both Name and Slug

- [ ] Change both name and slug → Both save successfully
- [ ] URL redirects to new slug
- [ ] Sidebar shows updated name

### Cancel Changes

- [ ] Change workspace name → Click "Cancel" → Form resets to original values
- [ ] After cancel → "Cancel" button disappears
- [ ] After cancel → "Save Changes" button is disabled

### Validation - Name

- [ ] Clear name field → Click "Save" → Shows "Name is required" error
- [ ] Enter 101 characters → Click "Save" → Shows "must be 100 characters or less" error

### Validation - Slug

- [ ] Enter "Invalid Slug!" → Shows "Invalid slug format" error
- [ ] Enter "-invalid" → Shows "Invalid slug format" error
- [ ] Enter "invalid-" → Shows "Invalid slug format" error
- [ ] Enter "has spaces" → Shows "Invalid slug format" error

### Validation - Duplicate Slug

- [ ] Have two workspaces: "workspace-a" and "workspace-b"
- [ ] In workspace-a settings, change slug to "workspace-b"
- [ ] Click "Save Changes" → Shows "Slug already in use" error
- [ ] Form does not submit

---

## 💾 User Story 3: Remember Last Visited Workspace (P3)

### Session Persistence - Basic

- [ ] Visit `/workspace/acme-corp`
- [ ] Navigate to `/admin/workspaces`
- [ ] Navigate to `/workspace` → Redirects to `/workspace/acme-corp`

### Session Persistence - Root

- [ ] Visit `/workspace/test-workspace`
- [ ] Navigate to `/` → Redirects to `/admin/workspaces` (not workspace)

### Session Persistence - Browser Restart

- [ ] Visit `/workspace/acme-corp`
- [ ] Close browser completely
- [ ] Reopen browser and log in
- [ ] Navigate to `/workspace` → Redirects to `/workspace/acme-corp`

### Session Persistence - Clear Storage

- [ ] Visit `/workspace/acme-corp`
- [ ] Open DevTools → Application → Local Storage → Delete `workspace-storage`
- [ ] Navigate to `/workspace` → Redirects to `/admin/workspaces`

### Session Persistence - Switch Workspaces

- [ ] Visit `/workspace/workspace-a`
- [ ] Visit `/workspace/workspace-b`
- [ ] Navigate to `/workspace` → Redirects to `/workspace/workspace-b` (most recent)

### Session Persistence - After Slug Change

- [ ] Visit `/workspace/old-slug`
- [ ] Change slug to `new-slug` in settings
- [ ] Navigate to `/workspace` → Redirects to `/workspace/new-slug`

---

## 📂 User Story 4: Projects Placeholder (P4)

- [ ] Navigate to `/workspace/acme-corp`
- [ ] Click "Projects" in sidebar → URL changes to `/workspace/acme-corp/projects`
- [ ] Page shows "Projects" header
- [ ] Page shows "Project management features coming soon" message
- [ ] Sidebar maintains workspace context (name and icon)
- [ ] Navigate directly to `/workspace/test-workspace/projects` → Page loads correctly

---

## 📱 Mobile Viewport Testing

### iPhone SE (375px)

- [ ] Set viewport to 375px width in DevTools
- [ ] Navigate to `/workspace/acme-corp` → Layout looks correct
- [ ] All touch targets are at least 44x44px
- [ ] No horizontal scrolling
- [ ] Text is readable

### Mobile - Settings Form

- [ ] Set viewport to 375px
- [ ] Navigate to settings page
- [ ] Form fields are tappable (not too small)
- [ ] Edit name and slug → Keyboard doesn't obscure form
- [ ] Save button is easily tappable
- [ ] Error messages are readable

### Tablet (768px)

- [ ] Set viewport to 768px width
- [ ] Test navigation → Layout adapts appropriately
- [ ] Test forms → All features remain accessible

---

## 🔒 Security Testing

### Non-Admin Access

- [ ] Log out
- [ ] Try to access `/workspace/acme-corp` → Redirects to `/login`
- [ ] Cannot access workspace routes without admin auth

### XSS Prevention - Workspace Name

- [ ] Create workspace with name: `<script>alert('XSS')</script>`
- [ ] Navigate to workspace → Script does NOT execute
- [ ] Name is safely displayed (no JavaScript runs)

### XSS Prevention - Slug

- [ ] Try invalid slug: `"><script>alert(1)</script>`
- [ ] Validation rejects it → Shows error
- [ ] Cannot bypass validation

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

**Tester**: ******\_******
**Date**: ******\_******
