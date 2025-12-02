# **📄 PRD — Sidebar Navigation System (Admin UI Redesign)**

**Version:** Draft v2
**Owner:** Igor
**Scope:** Admin App Navigation

# **0. Purpose**

This is a follow up PRD for the company context based navigation project /Users/iggyvileikis/Projects/@attempt-n2/clementine/specs/012-company-context

Key impacted areas are to navigation layout and router structure.

---

# **1. Purpose**

Introduce a **collapsible left sidebar navigation**, replacing the current top navigation and enabling a scalable admin interface as Clementine grows (Projects, Events, Experiences, Settings, Analytics, etc.).

The sidebar becomes the **primary navigation**, using **companySlug** for all company-scoped URLs.

---

# **2. Summary of Change**

Add a persistent, collapsible left sidebar that includes:

- Company Switcher (top)
- Navigation items with icons
- Collapse/expand behavior (YouTube-style)
- Logout button (bottom)
- Updated breadcrumb logic
- New routing using `/{companySlug}/…`
- Auto-company selection when user accesses `/`

---

# **3. Routing Requirements**

We use **companySlug** (human-readable) instead of companyId for all URLs.

### **Route list:**

```
/
/acme-corp

/acme-corp/projects
/acme-corp/proj123/events
/acme-corp/proj123/evt456/experiences

/acme-corp/exps
/acme-corp/exps/exp789

/acme-corp/analytics

/acme-corp/settings
```

### **Root behavior:**

- If user has recently accessed a company → redirect to `/{lastCompanySlug}/projects`
- If user has NO company history → redirect to `/companies` (company list)
- Last company slug is stored in persistent local storage

---

# **4. Sidebar Behavior & UX**

## **4.1 Collapsible Sidebar (YouTube-style)**

The sidebar collapse behavior should mimic YouTube:

- The **collapse toggle is always in the same top-left location**, so it does _not_ jump around in the UI.
- In YouTube, this is the "hamburger menu" icon.
- In Clementine, we choose between:

### **Option A — Collapse trigger is the company switcher area**

- More elegant
- Larger clickable area
- Reduces visual clutter
- Keeps the sidebar UX “product-specific” rather than copying YouTube literally

### **Option B — Separate hamburger icon above to the company switcher**

- More explicit
- Familiar to users
- Slightly more clutter

**We will pick Option B by default**

---

## **4.2 Sidebar Structure**

```
[ COMPANY SWITCHER or COLLAPSE ICON AREA ]
   (Avatar + Name)
   (Click → open company list in new tab)

[ Navigation Items ]
   Projects
   Experiences
   Analytics (later)
   Settings

[ Spacer ]

[ Logout Button ]
```

---

## **4.3 Behavior (Expanded State)**

- Width ~240–280px
- Each nav item shows:

  - Icon
  - Label (text)

- Active item highlighted
- Company switcher shows:

  - Avatar / image
  - Company name (full)

---

## **4.4 Behavior (Collapsed State)**

- Width ~72–80px
- Company switcher shrinks to:

  - Company avatar only

- Each nav item becomes:

  - Icon
  - Small label **under** the icon (YouTube-style)

- Tooltip on hover with full label

Collapse state persists in local storage.

---

## **4.5 Logout Button**

- Anchored at the **bottom of sidebar**
- Always visible in expanded or collapsed mode

---

# **5. Company Switcher Requirements**

- Visible at top of sidebar in both expanded and collapsed mode
- Shows:

  - Company avatar
  - Company name (expanded mode)

- Clicking opens `/companies` **in a new tab**

The company list page allows:

- View all companies
- Create new company
- Switch active company

---

# **6. Breadcrumb Rules**

Breadcrumbs appear in the main content area, above page content.

### **Breadcrumbs MUST NOT include company**, because:

- Company context is defined by the URL (`/{companySlug}`)
- Sidebar visually communicates the active company

### Examples:

`Projects / Summer Tour / Event: Day 1 `
`Experiences / Cyberpunk Portrait`
`Settings / Billing`

Breadcrumb nodes must be clickable.

---

# **7. Navigation Items (MVP)**

| Icon | Label                   | URL                        |
| ---- | ----------------------- | -------------------------- |
| 📁   | Projects                | `/{companySlug}/projects`  |
| 🎛️   | Experiences             | `/{companySlug}/exps`      |
| 📊   | Analytics (placeholder) | `/{companySlug}/analytics` |
| ⚙️   | Settings                | `/{companySlug}/settings`  |

Notes:

- Analytics item may be disabled until backend is ready
- AiPresets is NOT in navigation (internal module only)

---

# **8. Auto-Company Selection Logic**

On visiting `/`:

### If lastCompanySlug exists

Redirect to:
`/{lastCompanySlug}/projects`

### If not

Redirect to:
`/companies` (company list)

### When user switches active company

Store companySlug in persistent storage.

---

# **9. Acceptance Criteria**

### **Sidebar UX**

- Collapsible sidebar behaves like YouTube (stable collapse toggle position)
- Company switcher works in expanded/collapsed modes
- All menu items support icon + label; and icon + small label in collapsed mode
- Logout always at bottom

### **Routing**

- All URLs use companySlug
- Root path `/` properly resolves last active company
- Company list opens in a new tab when switcher is clicked

### **Breadcrumbs**

- Breadcrumbs exclude company name
- Breadcrumb hierarchy reflects URL hierarchy correctly

### **Persistence**

- Sidebar collapse state is saved
- Last active companySlug is saved

---

# **10. Out of Scope**

- Visual redesign of Project, Event, Experience editors
- Mobile sidebar UX (handled later)
- Team permissions or access control
- Analytics implementation (item only stubbed)
