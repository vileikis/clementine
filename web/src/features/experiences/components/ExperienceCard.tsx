"use client";

/**
 * Component: ExperienceCard
 *
 * Card displaying an experience in the list view.
 * Shows name, step count, and last updated date.
 * Includes link to experience editor.
 */

import Link from "next/link";
import { Layers, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Experience } from "../types";

/**
 * Format a timestamp to relative time string (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} ${months === 1 ? "month" : "months"} ago`;
  if (weeks > 0) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  return "just now";
}

interface ExperienceCardProps {
  experience: Experience;
  companySlug: string;
}

export function ExperienceCard({ experience, companySlug }: ExperienceCardProps) {
  const stepCount = experience.stepsOrder.length;
  const lastUpdated = formatRelativeTime(experience.updatedAt);

  return (
    <Link
      href={`/${companySlug}/exps/${experience.id}`}
      className="block group"
    >
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium line-clamp-1 group-hover:text-primary transition-colors">
            {experience.name}
          </CardTitle>
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
  );
}
