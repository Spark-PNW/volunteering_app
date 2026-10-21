"use client";

// Mounts invisibly in every tab via the root layout. Handles two cross-tab
// auth concerns:
//
//  1. Sign-in sync: if Firebase detects a persisted session (localStorage) on
//     any page that isn't the dashboard, redirect there automatically. This is
//     what makes "Remember me" work when opening a new tab.
//
//  2. Sign-out sync: when another tab calls broadcastSignOut(), this tab
//     receives the BroadcastChannel message, clears its own Firebase auth
//     state, and redirects to the landing page — so all tabs sign out together.

import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AUTH_CHANNEL_NAME, type AuthChannelMessage } from "@/lib/auth-channel";
import { auth } from "@/lib/firebase";

// Pages where a signed-in user should be redirected to /dashboard.
const GUEST_ONLY_PATHS = new Set(["/", "/login", "/signup"]);

export function AuthSync() {
  const router = useRouter();
  const pathname = usePathname();

  // 1. Redirect a persisted signed-in session to /dashboard when the user
  //    opens a guest-only page (landing, login, signup).
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user && GUEST_ONLY_PATHS.has(pathname)) {
        router.replace("/dashboard");
      }
    });
  }, [pathname, router]);

  // 2. Listen for sign-out broadcasts from other tabs.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      if (event.data.type === "signed-out") {
        // Clear Firebase auth state in this tab, then go to the landing page.
        signOut(auth).finally(() => {
          router.replace("/");
        });
      }
    };

    return () => channel.close();
  }, [router]);

  return null;
}
