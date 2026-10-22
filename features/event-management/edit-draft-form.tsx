"use client";

import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { CreateOpportunityForm } from "@/features/event-management/create-event-form";
import { auth, db } from "@/lib/firebase";

type DraftData = {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: string;
};

export function EditDraftForm({ draftId }: { draftId: string }) {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      const user = auth.currentUser;

      if (!user) {
        if (isMounted) {
          setError("Log in again to edit this draft.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "drafts", draftId));

        if (!snapshot.exists()) {
          if (isMounted) {
            setError("Draft not found.");
            setIsLoading(false);
          }
          return;
        }

        const data = snapshot.data();

        // Only the owner may edit.
        if (data.createdBy !== user.uid) {
          if (isMounted) {
            setError("You don't have permission to edit this draft.");
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setDraft({
            title: data.title ?? "",
            description: data.description ?? "",
            location: data.location ?? "",
            date: data.date ?? "",
            startTime: data.startTime ?? "",
            endTime: data.endTime ?? "",
            capacity: data.capacity != null ? String(data.capacity) : "",
          });
          setIsLoading(false);
        }
      } catch (caughtError) {
        if (isMounted) {
          if (
            caughtError instanceof FirebaseError &&
            caughtError.code === "permission-denied"
          ) {
            setError(
              "Firebase blocked this read. Confirm this account has role: staff and the latest rules are published.",
            );
          } else {
            setError("Could not load the draft. Please try again.");
          }
          setIsLoading(false);
        }
      }
    }

    loadDraft();

    return () => {
      isMounted = false;
    };
  }, [draftId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950">
        <section className="mx-auto w-full max-w-3xl">
          <p className="text-sm text-zinc-600">Loading draft...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950">
        <section className="mx-auto w-full max-w-3xl">
          <p
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        </section>
      </main>
    );
  }

  return (
    <CreateOpportunityForm
      draftId={draftId}
      initialValues={draft ?? undefined}
    />
  );
}
