export function getWorkspaceInitials(
  workspaceName: string | null | undefined,
): string {
  if (!workspaceName || workspaceName.trim() === '') {
    return '?'
  }

  const words = workspaceName.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    return words[0][0].toUpperCase()
  }

  return (words[0][0] + words[1][0]).toUpperCase()
}
