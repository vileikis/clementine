import { useNavigate } from '@tanstack/react-router'
import { useWorkspace } from '@/domains/workspace'
import { getWorkspaceInitials } from '../lib'
import { cn } from '@/shared/utils'

interface WorkspaceSelectorProps {
  workspaceSlug: string
  isCollapsed: boolean
}

export function WorkspaceSelector({
  workspaceSlug,
  isCollapsed,
}: WorkspaceSelectorProps) {
  const { data: workspace } = useWorkspace(workspaceSlug)
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
