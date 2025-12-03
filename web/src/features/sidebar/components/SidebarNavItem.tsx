'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NavigationItem } from '../types';

interface SidebarNavItemProps {
  item: NavigationItem;
  basePath: string;
  isCollapsed: boolean;
}

/**
 * Individual navigation item in the sidebar.
 * Supports expanded (icon + label) and collapsed (icon with small label underneath) modes.
 * YouTube-style collapse behavior.
 */
export function SidebarNavItem({
  item,
  basePath,
  isCollapsed,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const href = `${basePath}${item.href}`;
  const isActive = pathname.startsWith(href);

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
        isCollapsed && 'flex-col gap-1 px-0 py-2 text-center',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        !item.enabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          'transition-all',
          isCollapsed && 'text-[10px] w-full wrap-break-word'
        )}
      >
        {item.label}
      </span>
    </div>
  );

  // Disabled items are not clickable
  if (!item.enabled) {
    const disabledContent = (
      <div className="block">{content}</div>
    );

    // Show tooltip for disabled items in collapsed mode
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{disabledContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label} (Coming Soon)</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return disabledContent;
  }

  const linkContent = (
    <Link href={href} className="block">
      {content}
    </Link>
  );

  // Show tooltip in collapsed mode for longer labels
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
