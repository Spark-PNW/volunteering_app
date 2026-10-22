"use client";

import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { NavigationLinks } from "@/shared/navigation-links";
import { auth, db } from "@/lib/firebase";
import { signupClosesAtForDate } from "@/lib/opportunities";

function opportunityErrorMessage(error: unknown) {
  if (error instanceof FirebaseError && error.code === "permission-denied") {
    return "Firebase denied this write. Confirm this account has role: staff and the latest rules are published.";
  }

  return "Could not create the event. Please try again.";
}

type InitialValues = {
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: string;
};

type CreateOpportunityFormProps = {
  initialValues?: InitialValues;
  /** If set, "Save draft" overwrites this existing draft instead of creating a new one. */
  draftId?: string;
};

export function CreateOpportunityForm({
  initialValues = {},
  draftId,
}: CreateOpportunityFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [location, setLocation] = useState(initialValues.location ?? "");
  const [date, setDate] = useState(initialValues.date ?? "");
  const [startTime, setStartTime] = useState(initialValues.startTime ?? "");
  const [endTime, setEndTime] = useState(initialValues.endTime ?? "");
  const [capacity, setCapacity] = useState(initialValues.capacity ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Enter a title.");
      return;
    }

    if (!date) {
      setError("Choose a date.");
      return;
    }

    if (startTime >= endTime) {
      setError("Start time must be before end time.");
      return;
    }

    const signupClosesAt = signupClosesAtForDate(date);

    if (!signupClosesAt) {
      setError("Choose a valid date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        setError("Log in again before creating an event.");
        return;
      }

      const opportunity = await addDoc(collection(db, "opportunities"), {
        title: trimmedTitle,
        description: description.trim(),
        location: location.trim(),
        startTime,
        endTime,
        date,
        capacity: parseInt(capacity) || null,
        wrapUpSummary: "",
        videoUrl: "",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        signupClosesAt,
      });

      // If this was created from a draft, delete that draft now.
      if (draftId) {
        await deleteDoc(doc(db, "drafts", draftId));
      }

      router.push(`/staff/events/${opportunity.id}`);
    } catch (caughtError) {
      setError(opportunityErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setError("");

    const user = auth.currentUser;

    if (!user) {
      setError("Log in again before saving a draft.");
      return;
    }

    setIsSavingDraft(true);

    try {
      const draftData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startTime,
        endTime,
        date,
        capacity: parseInt(capacity) || null,
        createdBy: user.uid,
        savedAt: serverTimestamp(),
      };

      if (draftId) {
        // Overwrite the existing draft.
        await setDoc(doc(db, "drafts", draftId), draftData);
      } else {
        await addDoc(collection(db, "drafts"), draftData);
      }

      router.push("/staff/events/drafts");
    } catch (caughtError) {
      if (
        caughtError instanceof FirebaseError &&
        caughtError.code === "permission-denied"
      ) {
        setError(
          "Firebase denied this write. Confirm this account has role: staff and the latest rules are published.",
        );
      } else {
        setError("Could not save the draft. Please try again.");
      }
    } finally {
      setIsSavingDraft(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Spark Volunteering
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              {draftId ? "Edit Draft" : "Create Event"}
            </h1>
          </div>

          <NavigationLinks
            items={[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/staff/events", label: "Events" },
              ...(draftId
                ? [{ href: "/staff/events/drafts", label: "Saved Drafts" }]
                : []),
            ]}
          />
        </div>

        <form
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Title
              <input
                className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Start Time
                <input
                  className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  min="0.25"
                  step="60"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                End Time
                <input
                  className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  min="0.25"
                  step="60"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Date
                <input
                  className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                Capacity
                <input
                  className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  type="number"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Description
              <textarea
                className="mt-1 block min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium">
              Location
              <input
                className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
          </div>

          {error ? (
            <p
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSubmitting || isSavingDraft}
              type="submit"
            >
              {isSubmitting ? "Creating…" : "Create event"}
            </button>
            <button
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || isSavingDraft}
              type="button"
              onClick={handleSaveDraft}
            >
              {isSavingDraft ? "Saving…" : "Save draft"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
