"use client";

import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { type FormEvent, useState } from "react";

import { db } from "@/lib/firebase";
import { signupDocIdForEmail, normalizeSignupEmail } from "@/lib/signups";
import type { Opportunity } from "@/lib/opportunities";

type GuestSignupModalProps = {
  opportunity: Opportunity;
  onClose: () => void;
  onSuccess: () => void;
};

// Pop-up that collects a guest's name and email so they can sign up for an
// event without creating an account. Writes directly to the signups collection
// using a guest placeholder for studentId.
export function GuestSignupModal({
  opportunity,
  onClose,
  onSuccess,
}: GuestSignupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const signupDocId = signupDocIdForEmail(opportunity.id, trimmedEmail);

      await setDoc(doc(db, "signups", signupDocId), {
        studentId: `guest_${normalizeSignupEmail(trimmedEmail)}`,
        studentName: trimmedName,
        studentEmail: normalizeSignupEmail(trimmedEmail),
        opportunityId: opportunity.id,
        isGuest: true,
        createdAt: serverTimestamp(),
      });

      onSuccess();
    } catch {
      setError("Could not sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <section
        aria-labelledby="guest-signup-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-1">
          <p className="text-sm font-medium text-blue-700">Spark Volunteering</p>
          <h2 className="mt-2 text-lg font-semibold" id="guest-signup-title">
            Sign up for {opportunity.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Enter your details to reserve your spot. No account needed.
          </p>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Name
            <input
              className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Please wait…" : "Done"}
            </button>
          </div>

          <p className="mt-4 text-sm text-orange-400">
            <span className="font-semibold">Note:</span> Users that are not logged in will not be able to accurately log volunteer hours.
          </p>
        </form>
      </section>
    </div>
  );
}
