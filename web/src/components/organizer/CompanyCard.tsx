"use client";

import Link from "next/link";
import type { Company } from "@/lib/types/firestore";
import { Button } from "@/components/ui/button";

interface CompanyCardProps {
  company: Company;
  eventCount?: number;
  onEdit?: (company: Company) => void;
}

export function CompanyCard({ company, eventCount = 0, onEdit }: CompanyCardProps) {
  const formattedDate = new Date(company.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{company.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {eventCount} {eventCount === 1 ? "event" : "events"}
          </p>
        </div>

        {/* Optional brand color indicator */}
        {company.brandColor && (
          <div
            className="w-8 h-8 rounded border flex-shrink-0"
            style={{ backgroundColor: company.brandColor }}
            title={`Brand color: ${company.brandColor}`}
          />
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground">
        Created {formattedDate}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Link href={`/events?companyId=${company.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            aria-label={`View events for ${company.name}`}
          >
            View Events
          </Button>
        </Link>

        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(company)}
            aria-label={`Edit ${company.name}`}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
