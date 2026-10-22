import { SavedDraftsList } from "@/features/event-management/saved-drafts-list";
import { StaffGate } from "@/features/staff-experience/staff-gate";

export default function DraftsPage() {
  return (
    <StaffGate>
      <SavedDraftsList />
    </StaffGate>
  );
}
