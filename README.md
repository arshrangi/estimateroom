# Pointr

Ad-free, account-free, open-source planning poker for agile teams. Open a room, paste the link, estimate.

## Architecture at a glance

Pointr is **two Cloudflare Workers in one repo**:

- **The Nuxt app** (this root) — the UI and `POST /api/rooms`, built with the Nitro `cloudflare_module` preset.
- **The party Worker** (`party/`) — the realtime layer built on [partyserver](https://github.com/cloudflare/partykit/tree/main/packages/partyserver): **one Durable Object per room** acting as the authoritative WebSocket server, serving `/parties/room/:roomId`.

The browser connects to the party Worker via the `NUXT_PUBLIC_PARTY_HOST` runtime config. The message contract lives in `shared/` and is imported by both sides.

## Development

Install deps, then run **both** Workers together:

```bash
pnpm install
pnpm dev:all        # Nuxt on :3000 + party Worker on :8787
```

`dev:all` runs `nuxt dev` and the party Worker (`wrangler dev`) side by side. The app defaults `partyHost` to `127.0.0.1:8787`, so realtime works out of the box.

Running `pnpm dev` alone starts only the UI — the room page will keep trying to reach the party Worker on :8787 until you also run `pnpm dev:party`.

## Checks

```bash
pnpm test            # Vitest unit tests
pnpm typecheck       # Nuxt app types
pnpm typecheck:party # party Worker types
pnpm lint            # ESLint
pnpm build && pnpm check:bundle   # build + enforce the ~200 KB gzip JS budget
```

## Deployment

Two Workers, deployed separately (both free-tier). Set `NUXT_PUBLIC_PARTY_HOST` on the Nuxt Worker to the deployed party Worker's origin. Full deploy + self-host docs are tracked for a later milestone.
