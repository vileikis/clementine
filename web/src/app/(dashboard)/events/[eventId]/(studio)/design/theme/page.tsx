import { notFound } from "next/navigation";
import { getEventAction } from "@/features/events/actions";
import { ThemeEditor } from "@/features/events";

interface ThemePageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { eventId } = await params;

  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <ThemeEditor event={result.event} />
    </main>
  );
}
