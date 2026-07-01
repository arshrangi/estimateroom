// ABOUTME: Entry Worker for the realtime layer. Routes /parties/room/:roomId to that room's Durable Object.
// ABOUTME: Deployed as its own Cloudflare Worker; the Nuxt app connects to it via the partyHost runtime config.
import { routePartykitRequest } from 'partyserver'
import type { Env } from './env'
import { Room } from './room'

export { Room }

export default {
  async fetch(request, env): Promise<Response> {
    return (await routePartykitRequest(request, env)) || new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
