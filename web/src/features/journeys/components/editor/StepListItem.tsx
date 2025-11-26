"use client";

/**
 * Component: StepListItem
 *
 * A single step item in the step list with selection state.
 * Uses @dnd-kit/sortable for drag-and-drop reordering.
 * Mobile-first with ≥44px touch targets.
 * Includes context menu with duplicate and delete actions.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layout,
  Grid3X3,
  Camera,
  Type,
  AlignLeft,
  ListChecks,
  ToggleLeft,
  Gauge,
  Mail,
  Loader2,
  Gift,
  MoreVertical,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Step, StepType } from "@/features/steps/types";

interface StepListItemProps {
  step: Step;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

const STEP_TYPE_ICONS: Record<StepType, typeof Layout> = {
  info: Layout,
  "experience-picker": Grid3X3,
  capture: Camera,
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: ListChecks,
  yes_no: ToggleLeft,
  opinion_scale: Gauge,
  email: Mail,
  processing: Loader2,
  reward: Gift,
};

export function StepListItem({
  step,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  isDragging: globalDragging,
}: StepListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = STEP_TYPE_ICONS[step.type] || Layout;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border transition-colors cursor-grab active:cursor-grabbing",
        "min-h-[44px] touch-manipulation",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:bg-accent hover:border-accent-foreground/20",
        isDragging && "cursor-grabbing z-10 shadow-lg",
        globalDragging && !isDragging && "pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon + Index Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
        </div>

        {/* Step Title - allows 2 lines */}
        <p className="text-sm font-medium line-clamp-2 pt-0.5 flex-1">
          {step.title || "Untitled"}
        </p>

        {/* Context Menu */}
        {(onDuplicate || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Step actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDuplicate && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
