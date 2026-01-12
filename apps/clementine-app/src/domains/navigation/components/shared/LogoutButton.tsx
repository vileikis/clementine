import { LogOut } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'
import { useAuth } from '@/domains/auth'
import { cn } from '@/shared/utils'

interface LogoutButtonProps {
  isCollapsed: boolean
}

export function LogoutButton({ isCollapsed }: LogoutButtonProps) {
  const { logout } = useAuth()

  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-3',
        isCollapsed && 'justify-center',
      )}
      onClick={logout}
      title={isCollapsed ? 'Logout' : undefined}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>Logout</span>}
    </Button>
  )
}
