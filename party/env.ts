// ABOUTME: Cloudflare bindings available to the party Worker.
// ABOUTME: `Room` is the Durable Object namespace, one instance per room name.
export interface Env {
  Room: DurableObjectNamespace
  /** Optional override (ms) for the empty-room idle-expiry window; defaults to 1 hour. Used in tests. */
  IDLE_EXPIRY_MS?: string
  /** Optional override (ms) for the host-departure grace before auto-reassigning; defaults to 10s. Used in tests. */
  HOST_GRACE_MS?: string
}
