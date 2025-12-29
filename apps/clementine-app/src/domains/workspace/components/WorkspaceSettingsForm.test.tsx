import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { WorkspaceSettingsForm } from './WorkspaceSettingsForm'
import type { Workspace } from '../types/workspace.types'

// Mock useUpdateWorkspace hook
vi.mock('../hooks/useUpdateWorkspace', () => ({
  useUpdateWorkspace: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}))

// Helper to render component with required providers
function renderWithProviders(workspace: Workspace) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <WorkspaceSettingsForm workspace={workspace} />,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('WorkspaceSettingsForm', () => {
  const mockWorkspace: Workspace = {
    id: 'workspace-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    status: 'active',
    deletedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render workspace name and slug fields', () => {
      renderWithProviders(mockWorkspace)

      expect(screen.getByLabelText(/workspace name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/workspace slug/i)).toBeInTheDocument()
    })

    it('should pre-populate form with workspace data', () => {
      renderWithProviders(mockWorkspace)

      const nameInput = screen.getByLabelText(/workspace name/i)
      const slugInput = screen.getByLabelText(/workspace slug/i)

      expect((nameInput as HTMLInputElement).value).toBe('Acme Corp')
      expect((slugInput as HTMLInputElement).value).toBe('acme-corp')
    })

    it('should render save button disabled initially (no changes)', () => {
      renderWithProviders(mockWorkspace)

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeDisabled()
    })

    it('should not render cancel button initially', () => {
      renderWithProviders(mockWorkspace)

      expect(
        screen.queryByRole('button', { name: /cancel/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('should enable save button when name is changed', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const nameInput = screen.getByLabelText(/workspace name/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      expect(saveButton).toBeDisabled()

      await user.clear(nameInput)
      await user.type(nameInput, 'New Workspace Name')

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })
    })

    it('should enable save button when slug is changed', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const slugInput = screen.getByLabelText(/workspace slug/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      expect(saveButton).toBeDisabled()

      await user.clear(slugInput)
      await user.type(slugInput, 'new-workspace-slug')

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })
    })

    it('should show cancel button when form is dirty', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      expect(
        screen.queryByRole('button', { name: /cancel/i }),
      ).not.toBeInTheDocument()

      const nameInput = screen.getByLabelText(/workspace name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i }),
        ).toBeInTheDocument()
      })
    })

    it('should reset form when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const nameInput = screen.getByLabelText(/workspace name/i)

      // Change name
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('New Name')
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('Acme Corp')
      })
    })
  })

  describe('Validation', () => {
    it('should show error for empty name', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const nameInput = screen.getByLabelText(/workspace name/i)
      await user.clear(nameInput)

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for name exceeding 100 characters', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const nameInput = screen.getByLabelText(/workspace name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'a'.repeat(101))

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(
          screen.getByText(/must be 100 characters or less/i),
        ).toBeInTheDocument()
      })
    })

    it('should show error for invalid slug format', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const slugInput = screen.getByLabelText(/workspace slug/i)
      await user.clear(slugInput)
      await user.type(slugInput, 'Invalid Slug!')

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid slug format/i)).toBeInTheDocument()
      })
    })

    it('should show error for slug with leading hyphen', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const slugInput = screen.getByLabelText(/workspace slug/i)
      await user.clear(slugInput)
      await user.type(slugInput, '-invalid')

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid slug format/i)).toBeInTheDocument()
      })
    })

    it('should show error for slug with trailing hyphen', async () => {
      const user = userEvent.setup()
      renderWithProviders(mockWorkspace)

      const slugInput = screen.getByLabelText(/workspace slug/i)
      await user.clear(slugInput)
      await user.type(slugInput, 'invalid-')

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid slug format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Description', () => {
    it('should show name field description', () => {
      renderWithProviders(mockWorkspace)

      expect(
        screen.getByText(/display name for this workspace/i),
      ).toBeInTheDocument()
    })

    it('should show slug field description with redirect warning', () => {
      renderWithProviders(mockWorkspace)

      expect(
        screen.getByText(/changing this will redirect you to the new url/i),
      ).toBeInTheDocument()
    })
  })
})
