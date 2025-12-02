import { BarChart3 } from "lucide-react";

/**
 * Analytics placeholder page - Coming Soon
 * This page will eventually show engagement metrics, shares, and campaign success
 */
export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-4">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground max-w-md">
          Track engagement, shares, and campaign success. Coming soon.
        </p>
      </div>
    </div>
  );
}
