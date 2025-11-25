import { getJourneyAction } from "@/features/journeys/actions/journeys";
import { notFound } from "next/navigation";

interface JourneyEditorPageProps {
  params: Promise<{ eventId: string; journeyId: string }>;
}

/**
 * Journey Detail/Editor Page - Server Component
 * Shows journey name and WIP message (editor functionality coming later)
 */
export default async function JourneyEditorPage({
  params,
}: JourneyEditorPageProps) {
  const { journeyId } = await params;

  const result = await getJourneyAction(journeyId);

  if (!result.success) {
    notFound();
  }

  const journey = result.data;

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{journey.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {journey.stepOrder.length}{" "}
          {journey.stepOrder.length === 1 ? "step" : "steps"}
        </p>
      </div>

      <div className="flex items-center justify-center min-h-[300px] border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Work in Progress
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Journey editor is under development. Steps management coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
