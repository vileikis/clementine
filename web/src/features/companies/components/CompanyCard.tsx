"use client";

import Link from "next/link";
import type { Company } from "../types/company.types";

interface CompanyCardProps {
  company: Company;
  eventCount?: number;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const formattedDate = new Date(company.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/companies/${company.id}`}>
      <div className="border rounded-lg p-6 space-y-4 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{company.name}</h3>
            {/* <p className="text-sm text-muted-foreground mt-1">
              {eventCount} {eventCount === 1 ? "event" : "events"}
            </p> */}
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
      </div>
    </Link>
  );
}
