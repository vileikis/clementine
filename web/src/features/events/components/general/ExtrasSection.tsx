"use client";

import { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { ExtraSlotCard } from "./ExtraSlotCard";
import { ExtraSlotDrawer } from "./ExtraSlotDrawer";
import { useExperienceDetails } from "@/features/experiences";
import { updateEventExtraAction } from "../../actions";
import { EXTRA_SLOTS } from "../../constants";
import type { Event } from "../../types/event.types";

type ExtraSlotKey = keyof typeof EXTRA_SLOTS;

interface ExtrasSectionProps {
  event: Event;
}

/**
 * Section component displaying the extras slots (pre-entry gate, pre-reward).
 * Each slot can be empty or configured with an experience.
 */
export function ExtrasSection({ event }: ExtrasSectionProps) {
  const [editingSlot, setEditingSlot] = useState<ExtraSlotKey | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get experience IDs from configured extras
  const experienceIds = useMemo(() => {
    const ids: string[] = [];
    if (event.extras?.preEntryGate?.experienceId) {
      ids.push(event.extras.preEntryGate.experienceId);
    }
    if (event.extras?.preReward?.experienceId) {
      ids.push(event.extras.preReward.experienceId);
    }
    return ids;
  }, [event.extras]);

  // Fetch experience details for display
  const { experiencesMap, loading: loadingDetails } =
    useExperienceDetails(experienceIds);

  const handleToggleExtra = (slotKey: ExtraSlotKey, enabled: boolean) => {
    startTransition(async () => {
      const result = await updateEventExtraAction({
        projectId: event.projectId,
        eventId: event.id,
        slot: slotKey,
        enabled,
      });

      if (result.success) {
        toast.success(enabled ? "Extra enabled" : "Extra disabled");
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleClickSlot = (slotKey: ExtraSlotKey) => {
    setEditingSlot(slotKey);
  };

  // Get the experience link and details for a slot
  const getSlotData = (slotKey: ExtraSlotKey) => {
    const link = event.extras?.[slotKey];
    const experience = link?.experienceId
      ? experiencesMap[link.experienceId] ?? null
      : null;
    return { link, experience };
  };

  const preEntryGateData = getSlotData("preEntryGate");
  const preRewardData = getSlotData("preReward");

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold">Extras</h2>
        <p className="text-sm text-muted-foreground">
          Configure optional flows that run at specific points in the guest journey.
        </p>
      </div>

      {/* Extra slots */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ExtraSlotCard
          slotKey="preEntryGate"
          experienceLink={preEntryGateData.link}
          experience={preEntryGateData.experience}
          onClick={() => handleClickSlot("preEntryGate")}
          onToggle={
            preEntryGateData.link
              ? (enabled) => handleToggleExtra("preEntryGate", enabled)
              : undefined
          }
          isUpdating={isPending || loadingDetails}
        />

        <ExtraSlotCard
          slotKey="preReward"
          experienceLink={preRewardData.link}
          experience={preRewardData.experience}
          onClick={() => handleClickSlot("preReward")}
          onToggle={
            preRewardData.link
              ? (enabled) => handleToggleExtra("preReward", enabled)
              : undefined
          }
          isUpdating={isPending || loadingDetails}
        />
      </div>

      {/* Extra slot drawer - key forces remount when different slot selected or experience changes */}
      {editingSlot && (
        <ExtraSlotDrawer
          key={`${editingSlot}-${getSlotData(editingSlot).link?.experienceId ?? "empty"}`}
          open={editingSlot !== null}
          onOpenChange={(open) => {
            if (!open) setEditingSlot(null);
          }}
          projectId={event.projectId}
          eventId={event.id}
          companyId={event.companyId}
          slotKey={editingSlot}
          experienceLink={getSlotData(editingSlot).link}
          experience={getSlotData(editingSlot).experience}
        />
      )}
    </section>
  );
}
