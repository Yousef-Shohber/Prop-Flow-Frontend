# PropFlow frontend

React 19 + TypeScript + Vite 6 + Tailwind CSS 4, TanStack Query, React Router 6, React Hook Form + Zod, Radix UI,
GSAP/Lenis for motion. Arabic (RTL, default) and English, light and dark themes.

## Run it

```bash
npm install
cp .env.example .env        # then edit
npm run dev                 # against your real backend (proxied, see below)
npm run dev:mock            # against the built-in fake backend, no server needed
npm test                    # 75 tests (unit, component, i18n, Discover search, back-navigation)
npm run typecheck
npm run build               # type-checks, then builds to dist/
```

Demo accounts for `dev:mock` (password `demo12345`): `admin@demo.com`, `owner@demo.com`, `owner2@demo.com` (unverified),
`tenant@demo.com`, `tenant2@demo.com`, `staff@demo.com`. The mock backend only exists in development builds.

## Environment variables (unchanged names, one addition)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | `/api/v1` in development (Vite proxies `/api`), the full URL in production, e.g. `https://prop-flow-black.vercel.app/api/v1` |
| `VITE_PROXY_TARGET` | **New, dev only.** Where the dev proxy forwards `/api` (default `http://localhost:3000`) |
| `VITE_GOOGLE_OAUTH_ENABLED` | Show the Google button |
| `VITE_CURRENCY_CODE` | Display currency for rent (the backend has no currency) |
| `VITE_SUPPORT_EMAIL`, `VITE_DEFAULT_LANG`, `VITE_MOCK` | As before |

`package.json`, `vite.config.ts` and `tsconfig.json` were not in the zip you sent, so they were recreated from the
imports in `src/`. If you have your originals, keep yours (the only requirement is the `@` alias to `src`, the
`@tailwindcss/vite` plugin and `globals: true` for Vitest).

## Home / Discover search (latest pass)

`/home` now opens with a search card under the hero (tenants, owners, admins; maintenance staff have no property API access and keep
their job view). Two tabs, each sending **only filters the API documents**:

| Tab | Endpoint | Filters sent | Sort |
|---|---|---|---|
| Properties | `GET /properties` | `search`, `city`, `propertyType` | `createdAt`, `name`, `city` |
| Units | `GET /units` | `bedrooms`, `minPrice`, `maxPrice`, `status` (tenants: always `AVAILABLE`; owners/admins can choose) | `createdAt`, `rentAmount` |

All filters, sort and page live in the URL (`/home?search=…&page=2`), so opening a result and going Back restores the search.
Text fields are debounced (350 ms) and the Search button applies them immediately. Without filters the section shows the newest
3 items; with filters it shows 6 per page with pagination. **Home extras:** a "Browse by type" row of photo tiles (toggles the `propertyType` filter), a property-photo count badge on cards,
and a "Back to search results" link on property and unit pages. Cards and table rows pass the list URL (filters, sort, page) in router
state, so Back returns to exactly that search; pages opened directly fall back to `/properties` or `/units`.
Not possible with the current API: searching units by city/location,
price ranges on properties, and a rental-price sort on properties (price lives on units).

## What changed in the previous pass

- **Welcome / Overview page (`/home`)**: the first page after sign-in for all four roles. Compact hero with a role-specific
  headline and calls to action, KPI strip, "needs your attention" lists, quick actions, recent activity (notifications), and
  featured properties/units. Every number and list comes from the existing API; when there is nothing, it shows an empty
  state with a call to action. Nothing is mocked. `ROLE_HOME` now points to `/home` for every role (the analytics
  dashboard is unchanged at `/dashboard` and linked from Home).
- **Public landing page**: new hero with photo and the building illustration, a spaces gallery, the request-to-repair flow
  with the product's real status badges, a role explorer (tenant / owner / staff / admin) with clearly labelled illustrative
  previews, a "careful with access" section limited to what the backend really does, then the existing features, steps,
  FAQ and CTA. No customers, testimonials, partners or statistics are shown.
- **Photography**: `Photo` component with an illustration fallback and a build-time lookup (`src/lib/photos.ts`).
  See `docs/ASSETS.md` for the files to add.
- **Navigation**: a "Home" item first in the sidebar; breadcrumbs and the unverified-owner banner work on `/home`.
- **Tests**: Welcome page and 15 other routes rendered through the real router and guards for each role against the mock
  backend; landing page in both languages; `Photo` fallback; a test that every `t('key')` used in the source exists in the
  dictionaries.

## Open questions / backend limits (not simulated)

1. `rentAmount` has no currency or billing period in the backend; it is labelled "Rent" and formatted with `VITE_CURRENCY_CODE`.
2. Leases, maintenance and audit rows expose user IDs only (no names), so the Welcome page shows tenant names only where the API
   embeds them (rental and renewal requests).
3. "Open repairs" for tenants is counted from their latest 100 maintenance requests; there is no server-side counter.
4. No endpoint lists "owners awaiting verification", so the admin shortcut opens the owners list.
5. Rich social previews for the landing page need pre-rendering or host rules (client-rendered SPA).
