import { MOCK_WORKSPACES } from '../constants'
import { getWorkspaceInitials } from '../lib'

interface WorkspaceSelectorProps {
  workspaceId: string
}

export function WorkspaceSelector({ workspaceId }: WorkspaceSelectorProps) {
  const workspace = MOCK_WORKSPACES.find((w) => w.id === workspaceId)
  const initials = getWorkspaceInitials(workspace?.name)

  const handleClick = () => {
    window.open('/admin/workspaces', '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-12 h-12 bg-slate-700 text-slate-50 rounded-md hover:bg-slate-600 active:bg-slate-500 font-semibold text-lg transition-colors"
      aria-label={`Current workspace: ${workspace?.name || 'Unknown'}`}
    >
      {initials}
    </button>
  )
}
