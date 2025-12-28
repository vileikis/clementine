import { useNavigate } from '@tanstack/react-router'
import { MOCK_WORKSPACES } from '../constants'
import { getWorkspaceInitials } from '../lib'
import { cn } from '@/shared/utils'

interface WorkspaceSelectorProps {
  workspaceId: string
  isCollapsed: boolean
}

export function WorkspaceSelector({
  workspaceId,
  isCollapsed,
}: WorkspaceSelectorProps) {
  const workspace = MOCK_WORKSPACES.find((w) => w.id === workspaceId)
  const initials = getWorkspaceInitials(workspace?.name)
  const navigate = useNavigate()

  const handleClick = () => {
    navigate({ to: '/admin/workspaces' })
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center rounded-md font-semibold text-lg transition-colors',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        isCollapsed ? 'w-10 h-10' : 'w-12 h-12',
      )}
      aria-label={`Current workspace: ${workspace?.name || 'Unknown'}`}
      title={workspace?.name || 'Unknown workspace'}
    >
      {initials}
    </button>
  )
}
