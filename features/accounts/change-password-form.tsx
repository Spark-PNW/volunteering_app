// Description: Form that lets a signed-in user change their password.
//              Requires the current password (re-authentication) before
//              Firebase will accept a new one.

"use client";

import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { auth } from "@/lib/firebase";

// ================ Helpers ================

// Maps Firebase Auth error codes to user-readable messages.
// Re-authentication failures surface as auth/wrong-password or
// auth/invalid-credential depending on the Firebase SDK version.
function getFriendlyError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Something went wrong. Please try again.";
  }

  switch (error.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "The current password is incorrect.";
    case "auth/weak-password":
      return "Use a password with at least 6 characters.";
    case "auth/requires-recent-login":
      // Firebase occasionally demands a fully fresh session for sensitive ops.
      return "Your session has expired. Please sign out, sign back in, and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a bit, then try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Could not change your password. Please try again.";
  }
}

// ================ Component ================

// Name: ChangePasswordForm
// Description: Renders a card with three password fields (current, new,
//              confirm new). On submit it re-authenticates the user with
//              their current password, then calls Firebase updatePassword.
//              Shows a success banner on completion; shows an error banner
//              on any failure. All Firebase work is client-side only.
// Parameters:  none
// Returns:     JSX element
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Individual show/hide toggles so the user can reveal only what they need.
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    // ---- Client-side validation (no Firebase call yet) ----

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 6 characters.");
      return;
    }

    // ---- Firebase work ----

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("You must be logged in to change your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-authenticate first. Firebase requires proof of the current
      // password before allowing a sensitive change like updating credentials.
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Current password verified — now set the new one.
      await updatePassword(user, newPassword);

      // Clear all fields so the form is ready for another use.
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password updated successfully.");
    } catch (caughtError) {
      setError(getFriendlyError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Shared input class (same style used in auth-form.tsx) ----
  const inputClass =
    "block h-11 w-full rounded-md border border-zinc-300 px-3 pr-16 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Spark Volunteering</p>
          <h1 className="mt-2 text-2xl font-semibold">Change password</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* ---- Current password ---- */}
          <label className="block text-sm font-medium">
            Current password
            <div className="relative mt-1">
              <input
                className={inputClass}
                autoComplete="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-800"
                onClick={() => setShowCurrent((prev) => !prev)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {/* ---- New password ---- */}
          <label className="block text-sm font-medium">
            New password
            <div className="relative mt-1">
              <input
                className={inputClass}
                autoComplete="new-password"
                minLength={8}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-800"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {/* ---- Confirm new password ---- */}
          <label className="block text-sm font-medium">
            Confirm new password
            <div className="relative mt-1">
              <input
                className={inputClass}
                autoComplete="new-password"
                minLength={8}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-800"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {/* ---- Error banner ---- */}
          {error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {/* ---- Success banner ---- */}
          {successMessage ? (
            <p
              className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}

          <button
            className="flex h-11 w-full items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Please wait…" : "Update password"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-600">
          <Link
            className="font-medium text-blue-700 hover:text-blue-800"
            href="/dashboard"
          >
            ← Back to dashboard
          </Link>
        </p>
      </section>
    </main>
  );
}
