'use client';

import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { logoutAction } from '@/lib/actions/auth';

interface SidebarLogoutProps {
  isCollapsed: boolean;
}

/**
 * Logout button anchored at the bottom of the sidebar.
 * Shows icon + label (expanded) or icon only (collapsed).
 */
export function SidebarLogout({ isCollapsed }: SidebarLogoutProps) {
  const handleLogout = async () => {
    await logoutAction();
  };

  const content = (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className={cn(
        'w-full justify-start gap-3 min-h-[44px]',
        isCollapsed && 'justify-center px-0'
      )}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>Log out</span>}
    </Button>
  );

  if (isCollapsed) {
    return (
      <div className="px-2 py-3 border-t">
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>Log out</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return <div className="px-2 py-3 border-t">{content}</div>;
}
