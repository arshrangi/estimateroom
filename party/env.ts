// ABOUTME: Cloudflare bindings available to the party Worker.
// ABOUTME: `Room` is the Durable Object namespace, one instance per room name.
export interface Env {
  Room: DurableObjectNamespace
  /** Optional override (ms) for the empty-room idle-expiry window; defaults to 30 minutes. Used in tests. */
  IDLE_EXPIRY_MS?: string
}
