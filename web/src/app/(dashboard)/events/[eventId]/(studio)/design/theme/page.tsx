import { notFound } from "next/navigation";
import { getEventAction } from "@/features/events/actions/events";
import { ThemeEditor } from "@/features/events/components/designer";

interface ThemePageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { eventId } = await params;

  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return <ThemeEditor event={result.event} />;
}
