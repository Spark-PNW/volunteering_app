import Link from "next/link";

import { GuestOpportunitiesList } from "@/features/student-experience/guest-opportunities-list";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-zinc-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Spark Volunteering</p>
          <h1 className="mt-1 text-2xl font-semibold">Events</h1>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Sign in
        </Link>
      </div>

      <p className="mt-2 text-sm text-zinc-500">
        Browsing as a guest.{" "}
        <Link href="/login" className="font-medium text-blue-700 hover:text-blue-800">
          Sign in
        </Link>{" "}
        to track your hours and manage your signups.
      </p>

      <GuestOpportunitiesList />
    </main>
  );
}
