import { formatHours } from "@/lib/opportunities";

type VolunteeringStatsProps = {
  totalHours: number;
  pendingHours: number;
  eventsJoined: number;
};

// "Your Volunteering": the student's earned hours, hours still to be earned,
// and number of events joined. Hours move from pending to total once staff mark
// the signup completed (or the event date passes) — see signupStageFor.
export function VolunteeringStats({
  totalHours,
  pendingHours,
  eventsJoined,
}: VolunteeringStatsProps) {
  return (
    <>
      <h2 className="text-lg font-semibold">Your Volunteering</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Total Hours</p>
          <p className="mt-2 text-3xl font-semibold text-blue-950">
            {formatHours(totalHours)}
          </p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">Pending Hours</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">
            {formatHours(pendingHours)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-600">Events Joined</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {eventsJoined}
          </p>
        </div>
      </div>
    </>
  );
}
