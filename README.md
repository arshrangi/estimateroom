# EstimateRoom

Ad-free, account-free, open-source planning poker for agile teams. Open a room, paste the link, estimate.

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

1. **Install Wrangler and log in.**

   ```bash
   pnpm install
   pnpm exec wrangler login
   ```

2. **Deploy the party Worker** (the realtime Durable Object). Note the deployed host it prints (e.g. `estimateroom-party.<your-subdomain>.workers.dev`).

   ```bash
   pnpm exec wrangler deploy --config party/wrangler.jsonc
   ```

3. **Tell the app where the party Worker lives.** Set `NUXT_PUBLIC_PARTY_HOST` on the `estimateroom` Worker to that host (no protocol, host[:port] only). Either add it as a var/secret:

   ```bash
   pnpm exec wrangler secret put NUXT_PUBLIC_PARTY_HOST
   # value: estimateroom-party.<your-subdomain>.workers.dev
   ```

   …or add a `vars` entry to `wrangler.jsonc`. See `.env.example` for the local default. The browser opens `wss://<that host>/parties/room/:roomId`.

4. **Build and deploy the app Worker.**

   ```bash
   pnpm build
   pnpm exec wrangler deploy
   ```

### Continuous deployment

`.github/workflows/ci.yml` deploys both Workers automatically on merge to `main`. Add two repository secrets:

- `CLOUDFLARE_API_TOKEN` — a token with Workers Scripts + Durable Objects edit permissions.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account id.

The hosted instance runs the same two-Worker setup.

## Privacy

- **No accounts, no PII.** The only personal data is a self-chosen display name, stored in your own browser (`localStorage`), never on a server.
- **Ephemeral rooms.** The server holds only transient room state for the room's lifetime; a room with no one connected expires after 30 minutes and its state is discarded. Estimates are not persisted after a room expires.
- **No tracking.** No analytics that collect personal data, no third-party ad or tracking scripts.

## Support

EstimateRoom is free and stays ad-free, funded by voluntary sponsorship — never ads or a paywall. If it saves your team time, consider [sponsoring the project](https://github.com/sponsors/arshdeeprangi) (see `.github/FUNDING.yml`).

## Contributing

Issues and pull requests are welcome. Before opening a PR, run the full check suite (`pnpm lint && pnpm typecheck && pnpm test`) and keep changes within the ~200 KB gzip client-JS budget. The message contract in `shared/` is the source of truth for both Workers — change it there, never fork a copy.

## License

[Apache-2.0](./LICENSE).
