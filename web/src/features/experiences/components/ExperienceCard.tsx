"use client";

/**
 * Component: ExperienceCard
 *
 * Card displaying an experience in the list view.
 * Shows preview thumbnail (if available), name, step count, and last updated date.
 * Includes link to experience editor and context menu for delete.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers, Clock, MoreVertical, Trash2, ImageIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteExperienceDialog } from "./DeleteExperienceDialog";
import { formatRelativeTime } from "@/lib/utils/date";
import type { Experience } from "../types";

interface ExperienceCardProps {
  experience: Experience;
  companySlug: string;
}

export function ExperienceCard({ experience, companySlug }: ExperienceCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const stepCount = experience.stepsOrder.length;
  const lastUpdated = formatRelativeTime(experience.updatedAt);

  return (
    <>
      <div className="relative group">
        <Link
          href={`/${companySlug}/exps/${experience.id}/design`}
          className="block"
        >
          <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50 overflow-hidden">
            {/* Preview thumbnail */}
            <div className="relative aspect-video w-full bg-muted">
              {experience.previewMediaUrl ? (
                <Image
                  src={experience.previewMediaUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={experience.previewType === "gif"}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-medium line-clamp-1 group-hover:text-primary transition-colors">
                  {experience.name}
                </CardTitle>
                {/* Spacer to ensure dropdown doesn't overlap title */}
                <div className="w-8 shrink-0" />
              </div>
              {experience.description && (
                <CardDescription className="line-clamp-2">
                  {experience.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  <span>
                    {stepCount} {stepCount === 1 ? "step" : "steps"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{lastUpdated}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Context Menu - positioned absolutely in top-right corner */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Experience actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteExperienceDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        experience={experience}
      />
    </>
  );
}
