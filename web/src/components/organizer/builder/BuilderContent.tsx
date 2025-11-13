"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BuilderContentProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * BuilderContent component wraps the main content area
 * Part of Phase 4 (User Story 1) - Content Tab Layout Infrastructure
 *
 * Provides consistent layout for different builder sections:
 * - Title and description header
 * - Scrollable content area
 * - Responsive padding
 */
export function BuilderContent({
  title,
  description,
  children,
  className,
}: BuilderContentProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <header className="pb-6 border-b mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
