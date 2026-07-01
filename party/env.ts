// ABOUTME: Cloudflare bindings available to the party Worker.
// ABOUTME: `Room` is the Durable Object namespace, one instance per room name.
export interface Env {
  Room: DurableObjectNamespace
}
