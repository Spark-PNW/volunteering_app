import { EventsPageHeader } from "@/features/student-experience/events-page-header";
import { GuestOpportunitiesList } from "@/features/student-experience/guest-opportunities-list";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-zinc-950">
      <EventsPageHeader />
      <GuestOpportunitiesList />
    </main>
  );
}
