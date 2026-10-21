// Shared BroadcastChannel for cross-tab auth events.
// BroadcastChannel is browser-only, so callers must guard with typeof window.

export const AUTH_CHANNEL_NAME = "spark-auth";

export type AuthChannelMessage = { type: "signed-out" };

export function broadcastSignOut() {
  if (typeof window === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  channel.postMessage({ type: "signed-out" } satisfies AuthChannelMessage);
  // Close immediately — we only need a one-shot broadcast.
  channel.close();
}
