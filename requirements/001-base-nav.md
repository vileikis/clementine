# Goal: setup navigation backbone for clementine-app

### Routes:

- Create 3 main routing areas:
  - admin
  - workspace
  - guest
- /admin
  - /workspaces - WIP (default route)
  - /dev-tools - WIP
- /workspace/[workspaceId]
  - /projects - WIP (default route)
  - /settings - WIP
- /guest/[projectId]
  - WIP

### Reqs:

- Note that current tan stack app has some base home page and styling. We should make styling to use monochrome style. Remove old home page as it is no longer relevant
- Use right side collapsable sidebar navigation. You can pretty much copy old sidebar /Users/iggyvileikis/Projects/@attempt-n2/clementine/web/src/features/sidebar/components/Sidebar.tsx
- Anatomy
  - Hamburger icon on top
  - Nav items
  - Logout button on bottom
- Nav items By route
  - /admin
    - Workspaces
    - Dev Tools
  - /workspace
    - Projects
    - Settings
  - /workspace should have workspace selector before nav items, which works likes
    - Square with workspace first letters capitilised of first 2 words. Ex: Acme = A, Acme Inc. = AI, Acme Corporation Inc. = AC
    - On click it should open new tab /admin/workspaces
  - /guest should not have sidebar at all
- Show WIP text on the pages instead of real content as stated in WIP
