"use client";

import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";

// Shows the "Sign in" button and guest blurb only when no user is signed in.
export function EventsPageHeader() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setIsSignedIn(Boolean(user));
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Spark Volunteering</p>
          <h1 className="mt-1 text-2xl font-semibold">Events</h1>
        </div>
        {isSignedIn === false ? (
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Sign in
          </Link>
        ) : null}
      </div>

      {isSignedIn === false ? (
        <p className="mt-2 text-sm text-zinc-500">
          Browsing as a guest.{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:text-blue-800">
            Sign in
          </Link>{" "}
          to track your hours and manage your signups.
        </p>
      ) : null}
    </div>
  );
}
