// LiveKit token minting - client-side stub
// In production, this would be a server function

export async function mintLiveKitToken(input: { matchId: string; role: "publisher" | "viewer"; identity?: string; name?: string }) {
  if (!input?.matchId || typeof input.matchId !== "string") throw new Error("matchId required");
  if (input.role !== "publisher" && input.role !== "viewer") throw new Error("invalid role");

  // Stub - in production, this would call a server endpoint
  // that generates a LiveKit token using livekit-server-sdk
  const lkUrl = import.meta.env.VITE_LIVEKIT_URL || "wss://your-livekit-server.livekit.cloud";
  return {
    token: "stub-token",
    url: lkUrl,
  };
}
