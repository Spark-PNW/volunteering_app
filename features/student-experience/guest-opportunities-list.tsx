"use client";

import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

import { GuestSignupModal } from "@/features/student-experience/guest-signup-modal";
import {
  ActiveEventCard,
  PastEventCard,
} from "@/features/student-experience/student-event-cards";
import { StudentEventModal } from "@/features/student-experience/student-event-modal";
import { db } from "@/lib/firebase";
import {
  getLocalDateKey,
  isOpportunityPast,
  opportunityFromData,
  sortOpportunitiesByDate,
  type Opportunity,
} from "@/lib/opportunities";

// The public events page for guests (not signed in). Shows all events; when a
// guest presses "Sign up" the GuestSignupModal collects their name and email.
export function GuestOpportunitiesList() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [todayDateKey] = useState(getLocalDateKey);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [guestSignupOpportunity, setGuestSignupOpportunity] =
    useState<Opportunity | null>(null);

  const selectedOpportunity = selectedOpportunityId
    ? opportunities.find((o) => o.id === selectedOpportunityId)
    : null;

  useEffect(() => {
    let isMounted = true;

    async function loadOpportunities() {
      try {
        const snapshot = await getDocs(collection(db, "opportunities"));
        const loaded = sortOpportunitiesByDate(
          snapshot.docs.map((d) => opportunityFromData(d.id, d.data())),
        );
        if (isMounted) setOpportunities(loaded);
      } catch (caughtError) {
        if (isMounted) {
          if (
            caughtError instanceof FirebaseError &&
            caughtError.code === "permission-denied"
          ) {
            setError(
              "Events are not publicly visible yet. Sign in to browse events, or ask a maintainer to allow guest reads in the Firestore rules.",
            );
          } else {
            setError("Could not load events. Please refresh and try again.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOpportunities();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedOpportunity) return;

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setSelectedOpportunityId("");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOpportunity]);

  const activeOpportunities = opportunities.filter(
    (o) => !isOpportunityPast(o.date, todayDateKey),
  );
  const pastOpportunities = opportunities.filter((o) =>
    isOpportunityPast(o.date, todayDateKey),
  );

  return (
    <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      {/* "Sign in to see" stats banner */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        <span className="font-medium text-zinc-700">Your stats: </span>
        Sign in to see your volunteering hours and events joined.
      </div>

      <h2 className="mt-8 text-lg font-semibold">Available Events</h2>

      {error ? (
        <p
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-4 text-sm text-zinc-600">Loading events…</p>
      ) : null}

      {!isLoading && !error && activeOpportunities.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">No available events right now.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {activeOpportunities.map((opportunity) => (
          <ActiveEventCard
            isRemoving={false}
            isSignedUp={false}
            isSubmitting={false}
            isUpcoming={false}
            key={opportunity.id}
            onOpenDetails={() => setSelectedOpportunityId(opportunity.id)}
            onToggleSignup={() => setGuestSignupOpportunity(opportunity)}
            opportunity={opportunity}
            signupStage="not_signed_up"
          />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Past Events</h2>

      {!isLoading && !error && pastOpportunities.length === 0 ? (
        <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          No past events yet.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {pastOpportunities.map((opportunity) => (
          <PastEventCard
            isSignedUp={false}
            key={opportunity.id}
            onOpenDetails={() => setSelectedOpportunityId(opportunity.id)}
            opportunity={opportunity}
            signupStage="not_signed_up"
          />
        ))}
      </div>

      {/* Event detail modal (read-only for guests; signup triggers the guest popup) */}
      {selectedOpportunity ? (
        <StudentEventModal
          isPast={isOpportunityPast(selectedOpportunity.date, todayDateKey)}
          isRemoving={false}
          isSignedUp={false}
          isSubmitting={false}
          onClose={() => setSelectedOpportunityId("")}
          onToggleSignup={() => {
            setSelectedOpportunityId("");
            setGuestSignupOpportunity(selectedOpportunity);
          }}
          opportunity={selectedOpportunity}
        />
      ) : null}

      {/* Guest signup popup */}
      {guestSignupOpportunity ? (
        <GuestSignupModal
          opportunity={guestSignupOpportunity}
          onClose={() => setGuestSignupOpportunity(null)}
          onSuccess={() => {
            setMessage(`Signed up for ${guestSignupOpportunity.title}.`);
            setGuestSignupOpportunity(null);
          }}
        />
      ) : null}
    </section>
  );
}
