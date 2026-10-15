import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm text-center">
        <p className="text-sm font-medium text-blue-700">Spark Volunteering</p>
        <h1 className="mt-2 text-2xl font-semibold">Welcome</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Browse upcoming events or sign in to track your volunteering hours.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Sign in
          </Link>
          <Link
            href="/events"
            className="flex h-11 w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Check events
          </Link>
        </div>
      </section>
    </main>
  );
}
