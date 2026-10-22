"use client";

import { FirebaseError } from "firebase/app";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

import { auth, db } from "@/lib/firebase";
import { formatOpportunityDate } from "@/lib/opportunities";
import { NavigationLinks } from "@/shared/navigation-links";

type Draft = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number | null;
};

function draftsErrorMessage(error: unknown) {
  if (error instanceof FirebaseError && error.code === "permission-denied") {
    return "Firebase blocked this read. Confirm this account has role: staff and the latest rules are published.";
  }

  return "Could not load drafts. Please refresh and try again.";
}

export function SavedDraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function handleDelete(draftId: string) {
    setDeletingId(draftId);
    try {
      await deleteDoc(doc(db, "drafts", draftId));
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch {
      setError("Could not delete the draft. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDrafts() {
      const user = auth.currentUser;

      if (!user) {
        if (isMounted) {
          setError("Log in again to view your drafts.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, "drafts"), where("createdBy", "==", user.uid)),
        );

        if (isMounted) {
          setDrafts(
            snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                title: data.title ?? "",
                description: data.description ?? "",
                location: data.location ?? "",
                date: data.date ?? "",
                startTime: data.startTime ?? "",
                endTime: data.endTime ?? "",
                capacity: data.capacity ?? null,
              };
            }),
          );
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(draftsErrorMessage(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDrafts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="mx-auto w-full max-w-4xl">
        <div className="mb-5 flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
              href="/staff/events"
            >
              Events
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Saved Drafts</h1>
          </div>

          <NavigationLinks
            items={[
              { href: "/staff/events", label: "Events" },
              {
                href: "/staff/events/new",
                label: "Create new event",
                variant: "primary",
              },
            ]}
          />
        </div>

        {error ? (
          <p
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading drafts...</p>
        ) : drafts.length === 0 && !error ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No saved drafts yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {drafts.map((draft) => (
              <article
                key={draft.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {draft.title || (
                      <span className="italic text-zinc-400">Untitled</span>
                    )}
                  </h3>
                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
                    {draft.date ? (
                      <div>
                        <dt className="sr-only">Date</dt>
                        <dd>{formatOpportunityDate(draft.date)}</dd>
                      </div>
                    ) : null}
                    {draft.startTime && draft.endTime ? (
                      <div>
                        <dt className="sr-only">Time</dt>
                        <dd>
                          {draft.startTime} – {draft.endTime}
                        </dd>
                      </div>
                    ) : null}
                    {draft.location ? (
                      <div>
                        <dt className="sr-only">Location</dt>
                        <dd>{draft.location}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {draft.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
                      {draft.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                    href={`/staff/events/drafts/${draft.id}`}
                  >
                    Continue editing
                  </Link>
                  <button
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deletingId === draft.id}
                    type="button"
                    onClick={() => handleDelete(draft.id)}
                  >
                    {deletingId === draft.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
