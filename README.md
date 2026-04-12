# MarketLens AI

Tech job market intelligence: search and rank regions by role, explore markets on a map, inspect pay and demand metrics, compare regions, and read AI-grounded commentary tied to the same data.

## Stack

- **App**: [Next.js](https://nextjs.org) (App Router), React 19, TypeScript, Tailwind CSS v4, [shadcn-style](https://ui.shadcn.com) UI on [Base UI](https://base-ui.com)
- **Data**: PostgreSQL, [Drizzle ORM](https://orm.drizzle.team), Zod-validated APIs
- **Map**: [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl](https://visgl.github.io/react-map-gl/)
- **AI**: OpenAI (optional) for structured market explanations with caching and template fallback

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local or remote)

## Quick start

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set at least `DATABASE_URL`. See [Environment variables](#environment-variables) for optional keys.

3. **Database**

   Start Postgres (example with Docker):

   ```bash
   docker compose up -d
   ```

   Apply migrations and seed demo data:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   If migration fails on `jobs` / `source_id` uniqueness, run `npm run db:repair-jobs` once, then migrate again.

4. **Map (optional)**

   Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` so the explorer map renders. Without it, the map area shows setup instructions.

5. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Optional: real listings (Remotive)

Synthetic seed data is enough for UI and scoring demos. To load remote software jobs from [Remotive’s public API](https://github.com/remotive-com/remote-jobs-api) (respect their rate limits; run on a schedule in production, not in a tight loop):

```bash
DATABASE_URL="postgresql://..." npm run ingest:remotive
```

Optional env: `REMOTIVE_CATEGORY` (default `software-dev`), `REMOTIVE_LIMIT` (default caps fetch size).

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox token for the client map |
| `OPENAI_API_KEY` | No | Explanations; omitted uses template fallback |
| `OPENAI_MODEL` | No | Model id (default `gpt-4o-mini`) |

See `.env.example` for a ready-to-edit template.

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server (webpack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests) |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:push` | Push schema (dev only; skips migration files) |
| `npm run db:seed` | Seed regions + synthetic jobs |
| `npm run db:repair-jobs` | Fix `jobs` dedupe / index issues |
| `npm run ingest:remotive` | Ingest Remotive jobs |
| `npm run db:studio` | Drizzle Studio |

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/markets/search` | GET | Ranked markets + `queryId` for explain/compare |
| `/api/markets/[regionId]` | GET | Region detail + sample jobs |
| `/api/markets/explain` | POST | Structured AI explanation (cached) |
| `/api/markets/compare` | POST | Compare two regions |
| `/api/feedback` | POST | Telemetry / feedback events |

## Project layout (high level)

- `src/app` — App Router pages and route handlers
- `src/components/markets` — Explorer UI (map, filters, rankings, detail, compare)
- `src/lib/db` — Drizzle schema and DB client
- `src/lib/services` — Search, scoring, aggregation, explain, compare
- `src/lib/ingest` — Remotive fetch + normalization
- `scripts/` — Seed, ingest, repair utilities
- `drizzle/` — SQL migrations

## Deploying

The app is a standard Node server after `npm run build`. Provide `DATABASE_URL` (and optional `OPENAI_*`, `NEXT_PUBLIC_MAPBOX_TOKEN`) in the host environment. Run migrations against the production database before serving traffic.

## License

Private project (`"private": true` in `package.json`). Adjust as needed for your distribution.
