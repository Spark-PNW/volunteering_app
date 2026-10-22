import { EditDraftForm } from "@/features/event-management/edit-draft-form";
import { StaffGate } from "@/features/staff-experience/staff-gate";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDraftPage({ params }: Props) {
  const { id } = await params;

  return (
    <StaffGate>
      <EditDraftForm draftId={id} />
    </StaffGate>
  );
}
