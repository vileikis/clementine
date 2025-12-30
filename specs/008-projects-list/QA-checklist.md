# QA Testing Checklist: Projects List & Basic Project Management

**Feature**: `008-projects-list`
**Date**: 2025-12-30
**Tester**: _______________
**Environment**: ☐ Local Dev ☐ Staging ☐ Production

## Pre-Test Setup

- [ ] Dev server is running (`pnpm dev` from `apps/clementine-app/`)
- [ ] Firebase emulator is running OR connected to Firebase project
- [ ] Logged in as admin user
- [ ] Have access to at least one workspace
- [ ] Browser console open to check for errors
- [ ] Network tab open to monitor Firestore operations

---

## Test Suite 1: Empty State & Initial Load

**User Story**: US1 - View Projects List

### TC1.1: Empty State Display
- [ ] Navigate to `/workspace/[workspaceSlug]/projects`
- [ ] **Expected**: "No projects yet" message displays
- [ ] **Expected**: "Create your first project to get started" subtext displays
- [ ] **Expected**: "Create Project" button is visible and styled correctly
- [ ] **Expected**: No JavaScript errors in console
- [ ] **Expected**: Page loads in < 2 seconds

### TC1.2: Empty State Interactions
- [ ] Hover over "Create Project" button
- [ ] **Expected**: Button shows hover state (visual feedback)
- [ ] Click "Create Project" button
- [ ] **Expected**: Navigate to project details page
- [ ] **Expected**: URL changes to `/workspace/[workspaceSlug]/projects/[new-project-id]`
- [ ] **Expected**: New project appears in Firestore (check Firebase Console)

---

## Test Suite 2: Create Project

**User Story**: US2 - Create New Project

### TC2.1: Create Project from Empty State
- [ ] Start with no projects in workspace
- [ ] Click "Create Project" from empty state
- [ ] **Expected**: Project created with name "Untitled project"
- [ ] **Expected**: Project status is "draft"
- [ ] **Expected**: Redirected to `/workspace/[workspaceSlug]/projects/[projectId]`
- [ ] **Expected**: "Project details – work in progress" placeholder displays
- [ ] **Expected**: No errors in console

### TC2.2: Create Project from List View
- [ ] Navigate back to projects list
- [ ] **Expected**: Previously created project displays in list
- [ ] Click "Create Project" button in header
- [ ] **Expected**: New project created
- [ ] **Expected**: Redirected to new project details page
- [ ] **Expected**: Total of 2 projects now in workspace

### TC2.3: Create Multiple Projects
- [ ] Create 5 more projects rapidly (click create 5 times)
- [ ] **Expected**: All projects created successfully
- [ ] **Expected**: No duplicate project names cause issues
- [ ] **Expected**: All projects appear in list
- [ ] **Expected**: Projects sorted by creation date (newest first)

### TC2.4: Create Project - Network Error Handling
- [ ] Disconnect from internet / stop Firebase emulator
- [ ] Try to create a project
- [ ] **Expected**: Error is logged to Sentry (check Sentry dashboard if configured)
- [ ] **Expected**: User sees error feedback (mutation fails gracefully)
- [ ] Reconnect internet
- [ ] Try creating project again
- [ ] **Expected**: Works correctly after reconnection

---

## Test Suite 3: View Projects List

**User Story**: US1 - View Projects List

### TC3.1: List Display - Basic
- [ ] Ensure you have 3-5 projects in workspace
- [ ] Navigate to `/workspace/[workspaceSlug]/projects`
- [ ] **Expected**: All active projects display in cards
- [ ] **Expected**: Each card shows project name
- [ ] **Expected**: Each card shows status badge (draft/live)
- [ ] **Expected**: Draft status badge has "secondary" variant styling
- [ ] **Expected**: Live status badge has "default" variant styling
- [ ] **Expected**: Each card has delete button (trash icon)

### TC3.2: List Display - Sorting
- [ ] Check order of projects in list
- [ ] **Expected**: Projects sorted by creation date descending (newest first)
- [ ] Create a new project
- [ ] Navigate back to list
- [ ] **Expected**: New project appears at top of list

### TC3.3: List Display - Real-time Updates
- [ ] Open projects list in Browser Tab 1
- [ ] Open Firebase Console in Browser Tab 2
- [ ] In Firebase Console, manually update a project's name
- [ ] Switch back to Tab 1 (projects list)
- [ ] **Expected**: Project name updates in real-time (no page refresh needed)
- [ ] **Expected**: Update happens within 1-2 seconds

### TC3.4: List Display - Performance
- [ ] Create 20+ projects (use Firestore console for speed)
- [ ] Reload projects list page
- [ ] **Expected**: Page loads in < 2 seconds
- [ ] **Expected**: All projects render correctly
- [ ] **Expected**: No layout shift or flickering
- [ ] **Expected**: Smooth scrolling

### TC3.5: Loading State
- [ ] Clear browser cache
- [ ] Navigate to projects list
- [ ] **Expected**: Loading skeletons display while fetching
- [ ] **Expected**: Skeletons have same layout as actual cards
- [ ] **Expected**: Transition from loading to content is smooth

---

## Test Suite 4: Delete Project

**User Story**: US3 - Delete Project

### TC4.1: Delete Confirmation Dialog
- [ ] Click delete button (trash icon) on any project
- [ ] **Expected**: Confirmation dialog appears
- [ ] **Expected**: Dialog title is "Delete Project"
- [ ] **Expected**: Dialog message includes project name
- [ ] **Expected**: "Cancel" button is visible
- [ ] **Expected**: "Delete" button is visible with destructive styling (red)

### TC4.2: Cancel Deletion
- [ ] Open delete dialog for a project
- [ ] Click "Cancel" button
- [ ] **Expected**: Dialog closes
- [ ] **Expected**: Project remains in list
- [ ] **Expected**: Project still exists in Firestore
- [ ] Click delete button again
- [ ] Click outside dialog (backdrop)
- [ ] **Expected**: Dialog closes
- [ ] **Expected**: Project remains in list

### TC4.3: Confirm Deletion
- [ ] Note the project ID before deletion
- [ ] Open delete dialog for a project
- [ ] Click "Delete" button
- [ ] **Expected**: Button shows "Deleting..." text while processing
- [ ] **Expected**: Button is disabled during deletion
- [ ] **Expected**: Dialog closes after successful deletion
- [ ] **Expected**: Project disappears from list immediately
- [ ] **Expected**: Real-time update (no page reload needed)
- [ ] Check Firestore
- [ ] **Expected**: Project document has `status: "deleted"`
- [ ] **Expected**: Project document has `deletedAt` timestamp
- [ ] **Expected**: Project document has updated `updatedAt` timestamp

### TC4.4: Delete Project - 404 on Direct Access
- [ ] Copy URL of a project: `/workspace/[workspaceSlug]/projects/[projectId]`
- [ ] Delete that project
- [ ] Try to access the copied URL directly
- [ ] **Expected**: 404 page displays
- [ ] **Expected**: Cannot access deleted project

### TC4.5: Delete Project - Real-time List Update
- [ ] Open projects list in Browser Tab 1
- [ ] Open same projects list in Browser Tab 2
- [ ] In Tab 1, delete a project
- [ ] Switch to Tab 2
- [ ] **Expected**: Deleted project disappears from Tab 2 automatically
- [ ] **Expected**: Update happens within 1-2 seconds

### TC4.6: Delete Last Project
- [ ] Delete all projects except one
- [ ] Delete the last project
- [ ] **Expected**: Empty state displays after deletion
- [ ] **Expected**: "Create Project" CTA is visible

---

## Test Suite 5: Navigation & Routing

**User Story**: US4 - Access Project Details

### TC5.1: Navigate to Project Details
- [ ] Click on a project card (not the delete button)
- [ ] **Expected**: Navigate to `/workspace/[workspaceSlug]/projects/[projectId]`
- [ ] **Expected**: Project details page displays
- [ ] **Expected**: Placeholder message "Project details – work in progress" shows
- [ ] **Expected**: URL matches project ID

### TC5.2: Direct URL Access - Valid Project
- [ ] Copy a valid project URL
- [ ] Open in new tab
- [ ] **Expected**: Project details page loads
- [ ] **Expected**: No errors in console

### TC5.3: Direct URL Access - Deleted Project
- [ ] Create a project and note its ID
- [ ] Delete that project
- [ ] Navigate to `/workspace/[workspaceSlug]/projects/[deleted-project-id]`
- [ ] **Expected**: 404 page displays
- [ ] **Expected**: Cannot access deleted project

### TC5.4: Direct URL Access - Non-existent Project
- [ ] Navigate to `/workspace/[workspaceSlug]/projects/fake-project-id-12345`
- [ ] **Expected**: 404 page displays
- [ ] **Expected**: Proper error handling (no console errors)

### TC5.5: Back Navigation
- [ ] From projects list, click a project
- [ ] On details page, click browser back button
- [ ] **Expected**: Return to projects list
- [ ] **Expected**: List displays correctly
- [ ] **Expected**: No page reload (client-side navigation)

---

## Test Suite 6: Workspace Isolation & Security

**Critical Security Tests**

### TC6.1: Cross-Workspace Access Prevention
- [ ] Create a project in Workspace A (note the project ID)
- [ ] Switch to Workspace B
- [ ] Try to access `/workspace/[workspaceB-slug]/projects/[workspaceA-project-id]`
- [ ] **Expected**: 404 page displays
- [ ] **Expected**: Cannot access projects from other workspaces
- [ ] **Expected**: Firestore security rules block the read

### TC6.2: Workspace-Scoped List
- [ ] Create 3 projects in Workspace A
- [ ] Create 2 projects in Workspace B
- [ ] View projects list in Workspace A
- [ ] **Expected**: Only shows 3 projects from Workspace A
- [ ] Switch to Workspace B
- [ ] **Expected**: Only shows 2 projects from Workspace B
- [ ] **Expected**: No cross-contamination of projects

### TC6.3: Authentication Required
- [ ] Log out
- [ ] Try to access `/workspace/[workspaceSlug]/projects`
- [ ] **Expected**: Redirected to login page
- [ ] **Expected**: Cannot access projects without authentication

---

## Test Suite 7: Edge Cases & Error Scenarios

### TC7.1: Very Long Project Names
- [ ] In Firestore, create project with 100-character name (max allowed)
- [ ] View in projects list
- [ ] **Expected**: Name displays without overflow or layout breaking
- [ ] **Expected**: Text truncates gracefully if needed
- [ ] Try to create project with 101-character name (via console mutation)
- [ ] **Expected**: Firestore rules reject the creation

### TC7.2: Special Characters in Project Name
- [ ] In Firestore, create project with name: `Test "Project" with <HTML> & 'Quotes'`
- [ ] View in projects list
- [ ] **Expected**: Name displays correctly (no XSS vulnerabilities)
- [ ] **Expected**: Special characters rendered as text, not interpreted as code

### TC7.3: Rapid Deletion
- [ ] Create 5 projects
- [ ] Rapidly delete all 5 projects (one after another)
- [ ] **Expected**: All deletions succeed
- [ ] **Expected**: No race conditions or errors
- [ ] **Expected**: Empty state displays after last deletion

### TC7.4: Network Interruption During Delete
- [ ] Start deleting a project
- [ ] Immediately disconnect internet before deletion completes
- [ ] **Expected**: Error is handled gracefully
- [ ] **Expected**: Project may or may not be deleted (depends on timing)
- [ ] Reconnect internet
- [ ] Refresh page
- [ ] **Expected**: Correct state reflects what actually happened in Firestore

### TC7.5: Browser Refresh During Operation
- [ ] Click "Create Project"
- [ ] Immediately refresh browser while navigating
- [ ] **Expected**: No broken state
- [ ] **Expected**: Either creation completes or doesn't (no partial state)

---

## Test Suite 8: Mobile & Responsive Design

### TC8.1: Mobile View (320px - 768px)
- [ ] Resize browser to 375px width (iPhone size)
- [ ] View projects list
- [ ] **Expected**: Layout adapts to mobile viewport
- [ ] **Expected**: Cards stack vertically
- [ ] **Expected**: Text remains readable (no horizontal scroll)
- [ ] **Expected**: All interactive elements accessible

### TC8.2: Touch Targets
- [ ] On mobile viewport, check all interactive elements
- [ ] **Expected**: "Create Project" button is at least 44x44px
- [ ] **Expected**: Delete button (trash icon) is at least 44x44px
- [ ] **Expected**: Project card link area is easy to tap
- [ ] **Expected**: No accidental clicks on wrong elements

### TC8.3: Tablet View (768px - 1024px)
- [ ] Resize browser to 800px width (tablet size)
- [ ] View projects list
- [ ] **Expected**: Layout looks good at tablet size
- [ ] **Expected**: Appropriate spacing and sizing

### TC8.4: Desktop View (1024px+)
- [ ] View on desktop (1440px+ width)
- [ ] **Expected**: Layout looks polished
- [ ] **Expected**: Cards don't stretch too wide
- [ ] **Expected**: Proper spacing and visual hierarchy

---

## Test Suite 9: Performance & Scalability

### TC9.1: Load Time - Small Dataset
- [ ] Workspace with 5 projects
- [ ] Clear cache and reload
- [ ] Measure time to interactive
- [ ] **Expected**: < 2 seconds from navigation to full render

### TC9.2: Load Time - Large Dataset
- [ ] Create 100 projects in workspace (use Firestore console)
- [ ] Clear cache and reload projects list
- [ ] Measure time to interactive
- [ ] **Expected**: < 2 seconds (with composite index)
- [ ] **Expected**: Smooth scrolling through list

### TC9.3: Create Performance
- [ ] Measure time from clicking "Create Project" to seeing details page
- [ ] **Expected**: < 3 seconds for complete flow

### TC9.4: Delete Performance
- [ ] Measure time from clicking "Delete" to project disappearing
- [ ] **Expected**: < 1 second for deletion to complete

### TC9.5: Real-time Update Latency
- [ ] Open list in two browser tabs
- [ ] Create project in Tab 1
- [ ] Measure time until it appears in Tab 2
- [ ] **Expected**: < 2 seconds for real-time update

---

## Test Suite 10: Browser Compatibility

### TC10.1: Chrome/Edge (Chromium)
- [ ] Test all core flows in latest Chrome
- [ ] **Expected**: Everything works perfectly

### TC10.2: Firefox
- [ ] Test all core flows in latest Firefox
- [ ] **Expected**: Everything works perfectly

### TC10.3: Safari
- [ ] Test all core flows in latest Safari (Mac/iOS)
- [ ] **Expected**: Everything works perfectly
- [ ] **Expected**: No Safari-specific layout issues

---

## Test Suite 11: Accessibility

### TC11.1: Keyboard Navigation
- [ ] Navigate to projects list
- [ ] Use Tab key to navigate through page
- [ ] **Expected**: Can reach all interactive elements
- [ ] **Expected**: Focus indicators are visible
- [ ] Press Enter on "Create Project" button
- [ ] **Expected**: Creates project (keyboard activates button)

### TC11.2: Screen Reader (Optional)
- [ ] Use screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] **Expected**: All content is announced
- [ ] **Expected**: Interactive elements have proper labels
- [ ] **Expected**: Page structure is logical

### TC11.3: Color Contrast
- [ ] Check text contrast ratios (use browser DevTools)
- [ ] **Expected**: All text meets WCAG AA standards (4.5:1 for normal text)

---

## Test Suite 12: Data Integrity

### TC12.1: Firestore Document Structure
- [ ] Create a project
- [ ] Check Firestore document in Firebase Console
- [ ] **Expected**: Contains all required fields:
  - `id` (string)
  - `name` (string)
  - `workspaceId` (string)
  - `status` (enum: draft/live/deleted)
  - `activeEventId` (null)
  - `deletedAt` (null)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

### TC12.2: Soft Delete Integrity
- [ ] Delete a project
- [ ] Check Firestore document
- [ ] **Expected**: Document still exists
- [ ] **Expected**: `status` is "deleted"
- [ ] **Expected**: `deletedAt` is timestamp (not null)
- [ ] **Expected**: `updatedAt` is updated to deletion time

### TC12.3: No Hard Deletes
- [ ] Try to hard delete a project via Firestore console
- [ ] **Expected**: Firestore rules block the operation
- [ ] **Expected**: "Permission denied" error

---

## Test Suite 13: Error Recovery

### TC13.1: Firestore Rules Violation
- [ ] Manually trigger a Firestore rule violation (try to create without auth)
- [ ] **Expected**: Sentry captures the error (if configured)
- [ ] **Expected**: User sees appropriate error feedback
- [ ] **Expected**: Application doesn't crash

### TC13.2: Network Timeout
- [ ] Throttle network to "Slow 3G" in DevTools
- [ ] Try to load projects list
- [ ] **Expected**: Eventually loads (may take longer)
- [ ] **Expected**: Loading state shows during wait
- [ ] **Expected**: No timeout errors

---

## Post-Test Validation

### Cleanup
- [ ] Delete test projects created during QA
- [ ] Clear test data from Firestore (if using emulator)
- [ ] Document any bugs found

### Reporting
- [ ] Log all failed test cases with:
  - Test case ID
  - Steps to reproduce
  - Expected vs actual result
  - Screenshots/videos (if applicable)
  - Browser/environment details
- [ ] Create GitHub issues for critical bugs
- [ ] Update feature status based on results

---

## Sign-off

**QA Result**: ☐ PASS ☐ FAIL ☐ PASS WITH MINOR ISSUES

**Critical Bugs Found**: _______________

**Minor Issues Found**: _______________

**Tested By**: _______________

**Date**: _______________

**Notes**:
```
[Add any additional notes, observations, or recommendations here]
```

---

## Automated Test Coverage (Future)

Tests that should eventually be automated:
- [ ] Unit tests for `useProjects` hook
- [ ] Unit tests for `useCreateProject` hook
- [ ] Unit tests for `useDeleteProject` hook
- [ ] Component tests for `ProjectListItem`
- [ ] Component tests for `ProjectsPage`
- [ ] E2E tests for complete user flows

**Note**: Per constitution, minimal testing is acceptable. Prioritize critical user flows for automation.
