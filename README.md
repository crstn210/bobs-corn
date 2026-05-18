# Bob's Corn

Bob sells corn. His policy is simple: at most **one corn per client per minute**.
This is a small full-stack app that enforces that policy and lets clients buy,
review their history, and see what's been shipped.

**Stack:** Backbone.js (Vite + ES modules) · Tailwind v4 · Express · SQLite
(via `better-sqlite3`) · bcrypt.

---

## Getting started

### Prerequisites

- **Node.js ≥ 20** (developed on 26, supported back to 20 because that's the
  oldest version `better-sqlite3` ships prebuilt binaries for). Check with
  `node --version`.
- **npm** (ships with Node).
- No global system dependencies — `better-sqlite3` is the only native dep
  and it has prebuilt binaries for macOS/Linux/Windows on supported Node
  versions, so `npm install` should not need a C++ toolchain.

### Install

```bash
git clone <repo-url> bobs-corn
cd bobs-corn
npm install
```

### Run (development)

```bash
npm run dev
```

This starts two processes in parallel via `concurrently`:

- **API** — Express on http://localhost:3101 (auto-restarts on changes via
  `node --watch`)
- **Client** — Vite on http://localhost:5173 (HMR; proxies `/api/*` to the API)

Open **http://localhost:5173** in your browser. Sign in with one of the
[seeded credentials](#seeded-credentials) below.

The SQLite file `data.db` is created on first boot in the project root and
re-seeded idempotently — you can delete it any time to reset state (`rm
data.db data.db-shm data.db-wal`).

### Build (production)

```bash
npm run build      # builds the static client into dist/
npm run preview    # serves dist/ locally to preview (the API still needs `node server/index.js`)
```

In production, the Express server would also serve `dist/` (or a CDN would),
and the API would live behind a real hostname with TLS.

### Available scripts

| Script                | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `npm run dev`         | Run server + client together (the normal dev command)           |
| `npm run dev:server`  | Run just the Express API (`node --watch server/index.js`)       |
| `npm run dev:client`  | Run just Vite                                                   |
| `npm run build`       | Build the client into `dist/`                                   |
| `npm run preview`     | Serve the built `dist/` for a quick prod smoke check            |

### Environment variables

All optional — sensible defaults for local dev.

| Variable       | Default            | Purpose                                                              |
| -------------- | ------------------ | -------------------------------------------------------------------- |
| `PORT`         | `3101`             | API port (the Vite proxy targets this; change both if you change it) |
| `ADMIN_TOKEN`  | `dev-admin-token`  | Required in `X-Admin-Token` for `POST /api/ship`                     |
| `DB_PATH`      | `./data.db`        | SQLite file location                                                 |

### Troubleshooting

- **`EADDRINUSE: address already in use :::3101`** — something else is on the
  API port. Find it with `lsof -ti :3101` and kill, or run with a different
  port: `PORT=3102 npm run dev` (also update `vite.config.js`'s proxy target
  if you change it).
- **`EADDRINUSE` on 5173** — same thing for Vite. Run `npx vite --port 5174`
  manually, or kill the existing process.
- **Reset all state** — `rm -f data.db data.db-shm data.db-wal && npm run dev`.
  The seed re-runs on next boot.
- **Native build error from `better-sqlite3`** — you're probably on a Node
  version without a prebuilt binary. Either downgrade to Node 22/24 LTS, or
  install Xcode Command Line Tools (`xcode-select --install` on macOS) so
  node-gyp can compile from source.

### Seeded credentials

| Name    | Secret          |
| ------- | --------------- |
| `alice` | `secret-alice`  |
| `bob`   | `secret-bob`    |
| `carol` | `secret-carol`  |

Secrets are stored as bcrypt hashes (`server/db.js`); the table above is the
plaintext you type into the login form.

---

## Spec coverage

| Spec task                                                    | Where                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| 1. Non-authenticated portal to buy corn                      | `src/views/buy.js` (now behind auth; see senior task 3)  |
| 2. RESTful rate limiter: 200 OK / 429 Too Many Requests      | `server/corn.js` → `buyCorn`, `POST /api/buy`            |
| 3. Authentication via a secret                               | `server/auth.js`, `src/views/login.js`                   |
| 4. See past purchases                                        | `GET /api/purchases`, `src/views/history.js`             |
| 5. RESTful endpoint to mark *n* corn shipped for a client    | `POST /api/ship` (admin token), `corn.js → markShipped`  |
| 6. See purchased vs shipped                                  | summary cards + status badges in `src/views/history.js`  |

---

## API

All client endpoints accept and return JSON. Authenticated endpoints expect
`Authorization: Bearer <token>`.

| Method | Path             | Auth                | Purpose                                          |
| ------ | ---------------- | ------------------- | ------------------------------------------------ |
| POST   | `/api/login`     | —                   | `{name, secret}` → `{token, name}` (or 401)      |
| POST   | `/api/logout`    | Bearer              | revoke the current token                        |
| GET    | `/api/me`        | Bearer              | `{name}` — used to validate persisted tokens     |
| POST   | `/api/buy`       | Bearer              | 201 with purchase, or 429 + `Retry-After`        |
| GET    | `/api/purchases` | Bearer              | `{purchases: [{id, bought_at, shipped_at}, …]}`  |
| GET    | `/api/inventory` | Bearer              | `{purchased, shipped, pending}`                  |
| POST   | `/api/ship`      | `X-Admin-Token`     | Bob's endpoint — see below                       |

### Shipping (admin)

`POST /api/ship` lives outside the client auth scheme — it's Bob's endpoint,
not a client's. Auth is via a shared admin token in `X-Admin-Token` (default
`dev-admin-token`, overridable with `ADMIN_TOKEN=…`). It marks the *N* oldest
unshipped corn for the named client as shipped and returns the actual count
shipped (may be less than requested):

```bash
curl -X POST http://localhost:3101/api/ship \
  -H 'X-Admin-Token: dev-admin-token' \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"alice","quantity":2}'
# → {"client":"alice","requested":2,"shipped":2}
```

---

## Architecture decisions (and why)

A few non-obvious choices the interview will probably ask about.

**Atomic rate limit.** The buy handler wraps the "check last purchase" +
"insert new purchase" in a `db.transaction()` so two concurrent buys can't both
pass the elapsed-time check before either insert. Verified with 10 parallel
requests: exactly one 201, nine 429s. The single-process Node + sync
`better-sqlite3` setup makes this defense-in-depth today, but the transaction
is the only thing that makes the operation correct under any deployment
topology.

**bcrypt + opaque tokens.** Client secrets are bcrypt-hashed (`server/db.js`)
and verified with `bcrypt.compare`. Unknown-user logins still run a dummy
`compare` so login latency doesn't leak whether a name exists. Session tokens
are opaque random 256-bit values stored in the `sessions` table — picked over
JWT because the scope is tiny, server-side revocation by row delete is simpler
than rotating signing keys, and there's no need for the cross-service
verifiability JWT exists for.

**Vite + Backbone (with jQuery scoped to View).** The role's stack is "a
custom framework based on Backbone" — almost certainly a bundled codebase,
so I built the client as ES modules under Vite rather than the classic
script-tag layout. jQuery is required for `Backbone.View`'s event hash and
`$el` helpers (the View layer is genuinely coupled to jQuery's API), so I
keep it. But `Backbone.sync` has no such coupling, so `Backbone.ajax` is
overridden to delegate to a `fetch` wrapper that injects the Bearer header
and surfaces 429's `Retry-After` cleanly. See `src/api.js`.

**Tailwind, hand-rolled components.** The closest equivalent to shadcn for
non-React stacks is Tailwind + DaisyUI/Flowbite, but rather than reach for a
component library I wrote the markup directly — shadcn's own philosophy is
"own your components", which applies the same way here. For ~4 small views
the marginal cost of hand-rolling is low.

**Hash routing.** `Backbone.history.start()` uses hash routes by default; no
server-side SPA fallback needed, so the Express server stays a pure JSON API
and the client is fully static.

**Toast as vanilla module.** `src/views/toast.js` isn't a `Backbone.View`. A
toast is a transient notification with no state to model — wrapping it in a
View abstraction would be over-engineering. The rest of the client is
Backbone; this is the one place a `_.template`-and-string-concat helper
fits better.

---

## Repo layout

```
bobs-corn/
├── server/
│   ├── index.js          # express boot + route wiring
│   ├── db.js             # better-sqlite3 + schema + bcrypt seed
│   ├── auth.js           # login / Bearer middleware
│   └── corn.js           # buyCorn / listPurchases / markShipped / inventoryFor
├── src/
│   ├── main.js           # entry: Backbone.$=$, session.refresh, router.start
│   ├── api.js            # fetch wrapper + Backbone.ajax override
│   ├── router.js         # Backbone.Router with auth guards
│   ├── models/
│   │   ├── session.js    # singleton: token in localStorage, login/logout/refresh
│   │   ├── purchase.js
│   │   └── purchases.js  # Collection with stats()
│   └── views/
│       ├── app.js        # shell + nav + view swapping
│       ├── login.js
│       ├── buy.js        # button + Retry-After-driven cooldown
│       ├── history.js    # summary cards + table
│       └── toast.js      # vanilla helper
├── index.html
├── vite.config.js        # /api proxy to :3101
└── package.json
```

---

## What I'd do next (out of scope)

- **Tests.** Vitest for the rate-limit transaction (the highest-value test
  surface), the auth middleware, and the API helper's 429 normalization.
- **Token TTL + rotation.** Sessions currently never expire; for prod, a
  `created_at` check + sliding refresh is straightforward.
- **Admin UI.** The ship endpoint is curl-only today; Bob would want a small
  page.
- **Rate-limit configurability.** `RATE_LIMIT_MS` is a constant in
  `server/corn.js`; in prod it'd come from env or per-tier config.
- **Production build pipeline.** `npm run build` produces a static client in
  `dist/`; in prod the Express server would serve it (or a CDN) and the API
  would live at a real hostname behind TLS.
