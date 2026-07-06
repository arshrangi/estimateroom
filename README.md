# EstimateRoom

Ad-free, account-free, open-source planning poker for agile teams. Open a room, paste the link, estimate.

**Try it live:** [estimateroom.rangiarshdeep.workers.dev](https://estimateroom.rangiarshdeep.workers.dev)

- **No ads, no signup, ever.** The only personal data is a display name you type, kept in your own browser.
- **Real-time.** Votes, reveals, and presence propagate instantly over WebSockets.
- **Hidden votes.** Individual votes stay secret until a simultaneous reveal, so no one anchors the room.
- **One dense screen.** The whole session — table, cards, everyone's status — fits without scrolling, up to ~15 people.
- **Light & dark**, WCAG 2.1 AA, keyboard-operable, reduced-motion aware.
- **Fork and self-host** on your own free Cloudflare account.

## Architecture at a glance

EstimateRoom is **two Cloudflare Workers in one repo**:

- **The Nuxt app** (repo root) — the UI and `POST /api/rooms`, built with the Nitro `cloudflare_module` preset.
- **The party Worker** (`party/`) — the realtime layer built on [partyserver](https://github.com/cloudflare/partykit/tree/main/packages/partyserver): **one Durable Object per room** acting as the authoritative WebSocket server at `/parties/room/:roomId`. Live state lives in the DO; a snapshot persists to its built-in SQLite so a room survives restarts and brief disconnects.

The browser connects to the party Worker via the `NUXT_PUBLIC_PARTY_HOST` runtime config. The message contract (types + Zod schemas) lives in `shared/` and is imported by both sides — one source of truth, validated on the server.

## Quickstart (development)

Requires Node 22+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev:all        # Nuxt on :3000 + party Worker on :8787
```

`dev:all` runs `nuxt dev` and the party Worker (`wrangler dev`) side by side. The app defaults `partyHost` to `127.0.0.1:8787`, so realtime works out of the box. Open http://localhost:3000 and click **Create a room**.

Running `pnpm dev` alone starts only the UI — the room page will keep trying to reach the party Worker on :8787 until you also run `pnpm dev:party`.

## Checks

```bash
pnpm test            # Vitest unit tests
pnpm typecheck       # Nuxt app types
pnpm typecheck:party # party Worker types
pnpm lint            # ESLint
pnpm build && pnpm check:bundle   # build + enforce the ~200 KB gzip JS budget
pnpm test:e2e        # Playwright multi-client end-to-end tests
```

CI runs lint, typecheck (both Workers), unit tests, the bundle-size budget, and the E2E suite on every pull request.

## Deploy / self-host

EstimateRoom is designed to **fork and deploy to your own free Cloudflare account**. Both Workers run comfortably on the free tier (Durable Objects included).

Deploy order matters: the party Worker must exist first, because the app Worker needs its host baked into `NUXT_PUBLIC_PARTY_HOST` — with that unset, the app deploys fine but every room silently fails to connect.

1. **Install Wrangler and log in.**

   ```bash
   pnpm install
   pnpm exec wrangler login
   ```

2. **Deploy the party Worker** (the realtime Durable Object). If this account has never deployed a Worker, Wrangler asks you to pick a `workers.dev` subdomain first. Note the deployed host it prints (e.g. `estimateroom-party.<your-subdomain>.workers.dev`).

   ```bash
   pnpm exec wrangler deploy --config party/wrangler.jsonc
   ```

3. **Tell the app where the party Worker lives.** Set `NUXT_PUBLIC_PARTY_HOST` on the `estimateroom` Worker to that host (no protocol, host[:port] only):

   ```bash
   echo "estimateroom-party.<your-subdomain>.workers.dev" | pnpm exec wrangler secret put NUXT_PUBLIC_PARTY_HOST
   ```

   Wrangler will offer to create the `estimateroom` Worker as a draft since it doesn't exist yet — say yes. Use a secret (or a `vars` entry in `wrangler.jsonc`), not a dashboard variable: dashboard variables are wiped by the next `wrangler deploy`, secrets persist. See `.env.example` for the local default. The browser opens `wss://<that host>/parties/room/:roomId`.

4. **Build and deploy the app Worker.**

   ```bash
   pnpm build
   pnpm exec wrangler deploy
   ```

5. **Verify.** Open `https://estimateroom.<your-subdomain>.workers.dev`, create a room, join it from a second tab, vote, and reveal. That one pass exercises SSR, static assets, the room API, the WebSocket, and the Durable Object. The first requests right after a deploy can return Cloudflare 404/1042 errors while the `workers.dev` route propagates — it clears within seconds.

### Redeploying

Deploys are manual. After changing app code (`app/`, `server/`, `shared/`):

```bash
pnpm build && pnpm exec wrangler deploy
```

After changing the realtime layer (`party/`, `shared/`):

```bash
pnpm exec wrangler deploy --config party/wrangler.jsonc
```

`shared/` is imported by both Workers, so a contract change means redeploying both. `NUXT_PUBLIC_PARTY_HOST` is already stored as a secret and survives redeploys — you only set it again if the party Worker's host changes.

The hosted instance at [estimateroom.rangiarshdeep.workers.dev](https://estimateroom.rangiarshdeep.workers.dev) runs the same two-Worker setup.

## Privacy

- **No accounts.** The only personal data is a self-chosen display name. It is remembered in your own browser (`localStorage`) and sent to the server only while a room is live, where it is kept in the room's transient state and discarded when the room expires.
- **Ephemeral rooms.** The server holds only transient room state for the room's lifetime; a room with no one connected expires after 1 hour and its state is discarded. Estimates are not persisted after a room expires.
- **No tracking.** No analytics that collect personal data, no third-party ad or tracking scripts.

## Support

EstimateRoom is free and stays ad-free, funded by voluntary sponsorship — never ads or a paywall. If it saves your team time, consider [buying me a coffee](https://buymeacoffee.com/arshrangi) (see `.github/FUNDING.yml`).

## Contributing

Issues and pull requests are welcome. Before opening a PR, run the full check suite (`pnpm lint && pnpm typecheck && pnpm test`) and keep changes within the ~200 KB gzip client-JS budget. The message contract in `shared/` is the source of truth for both Workers — change it there, never fork a copy.

## License

[Apache-2.0](./LICENSE).
