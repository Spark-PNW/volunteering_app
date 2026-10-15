"use client";

import { FirebaseError } from "firebase/app";
import { collection, doc, getDocs, limit, query, where, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { db } from "@/lib/firebase";

export function DeleteEventButton({
  opportunityId,
  title,
}: {
  opportunityId: string;
  title: string;
}) {
  const router = useRouter();
  const deleting = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting.current) return;
    if (!window.confirm(`Delete “${title}” and all its signups? This cannot be undone.`)) return;

    deleting.current = true;
    setIsDeleting(true);
    setError("");

    try {
      // Keep the event and signup deletions in one atomic batch (500 writes).
      const signups = await getDocs(query(
        collection(db, "signups"),
        where("opportunityId", "==", opportunityId),
        limit(500),
      ));

      if (signups.size >= 500) {
        setError("This event has too many signups to delete here. Contact a maintainer for help.");
        deleting.current = false;
        setIsDeleting(false);
        return;
      }

      const batch = writeBatch(db);
      signups.docs.forEach((signup) => batch.delete(signup.ref));
      batch.delete(doc(db, "opportunities", opportunityId));
      await batch.commit();

      // Refresh the router cache so the event list loads the remaining events.
      router.replace("/staff/events");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof FirebaseError && caughtError.code === "permission-denied"
          ? "You do not have permission to delete this event. Please use a staff account."
          : "Could not delete this event. Please try again.",
      );
      deleting.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
      >
        {isDeleting ? "Deleting event..." : "Delete event"}
      </button>
      <p className="mt-2 text-sm text-zinc-600">Permanently deletes this event and its signups.</p>
      {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
