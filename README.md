# Box partner knowledge portal

A Vercel-hosted site in front of a Box library. Authors stay in Box. Readers get pages, previews of site changes, and ask-the-library that cannot see files they cannot open.

Planning lives in [`docs/`](docs/00-overview.md). Until Box env vars are set, the app serves a fixture library.

## Try it (fixtures)

```bash
npm install
npm test
npm run dev
```

1. `/products/welcome` — public, no login.
2. `/products/sku-a/battlecard` while logged out — 404.
3. `/login` with an account from `demo-reviewers.json` (see Box library below). Fixtures-only: `partner@example.com` / `partner`.
4. Open the battlecard again — 200 for Alex and Sam; still 404 for Riley.
5. `/ask` — public questions work logged out; partner pricing only after Alex logs in. Needs `AI_GATEWAY_API_KEY` locally.
6. On a datasheet, **Draft leave-behind**. Logged out it stays public. After Alex, a battlecard brief can include competitive notes.

Live: [https://partner-knowledge-portal.vercel.app](https://partner-knowledge-portal.vercel.app)

## Acceptance checks

| # | User | Question / action | Must | Must not |
|---|---|---|---|---|
| 1 | public | What is the Pulse Controller? | A public `/products/...` citation | Partner pricing or multipliers |
| 2 | Alex | How do we handle Acme? | Battlecard path | Files outside the library |
| 3 | logged out | `/products/sku-a/battlecard` | 404 | 200 |
| 4 | any | Edit a public article in Box, refresh | New sentence without a redeploy | Stale body forever |
| 5 | any | Kill `ASK_MODEL` / use a bad primary | Leave-behind or ask still answers via `ASK_FALLBACK_MODEL` | App rewrite |

## Box library

Seeded as **Helios Controls**: commercial HVAC / building-automation sold through distributors. Library folder `Partner_Application` (`412216273582`).

```
Partner_Application/          ← BOX_LIBRARY_FOLDER_ID
  public/                     ← no login (CCG reads bodies)
    sku-a--datasheet.pdf
    sku-b--datasheet.pdf
    welcome.md
    sku-a--overview.md
    sku-b--overview.md
    support--getting-started.md
    company--channel-program.md
    training--public-calendar.md
  partner/                    ← collaborations only
    sku-a--install-guide.pdf
    sku-a--battlecard.md
    sku-a--pricing.md
    sku-a--objection-handling.md
    sku-a--win-stories.md
    sku-b--battlecard.md
    sku-b--pricing.md
    competitive--acme-controls.md
    playbook--q3-enablement.md
    discount--authorization.md
```

Filenames use `--` for `/` in the URL (`sku-a--battlecard.md` → `/products/sku-a/battlecard`).

### Demo partner logins

Site login is not Box OAuth. Each demo email maps to an **App User** id; the gate calls Box As-User as that id.

| Login | Password | App User | Partner access |
|---|---|---|---|
| alex@example.com | review-alex | 52499401784 | Viewer on the whole `partner/` folder (inherits every partner article) |
| sam@example.com | review-sam | 52500078484 | Viewer on SKU-A and SKU-B **battlecards only** (pricing 404s) |
| riley@example.com | review-riley | 52499848721 | Public pages only; partner URLs 404 |

Riley is collaborated on nothing under `partner/`. Public files are not collaborated to App Users; CCG lists and caches those bodies after the audience gate.

`demo-reviewers.json` is gitignored and already pointed at these ids. Local markdown used for the upload lives in `box-seed/` (also gitignored).

1. Custom App: **Client Credentials Grant**, **As-User**, authorized on the enterprise.
2. Service account is `AutomationUser_2662859_11oltU9qfN@boxdevedition.com` (Partner Page Application). App Users and the library webhook must belong to this app — not a second Custom App’s automation user. Folder creates/uploads were done as the folder owner (`jswiatek@boxdemo.com`) because the empty `Partner_Application` folder is owned by that managed user.
3. Webhook `8201396769` is on `Partner_Application` (created as that service account) and posts to `https://partner-knowledge-portal.vercel.app/api/webhooks/box` (`FILE.UPLOADED`, rename, trash, delete, restore, move, copy). HMAC uses the **primary signature key** of Custom App 2662859 in `BOX_WEBHOOK_SIGNATURE_KEY` (local `.env` and Vercel). Unsigned deliveries are ignored.
4. If the webhook is not ready, `POST /api/revalidate?secret=$REVALIDATE_SECRET&fileId=<id>` busts `doc:<fileId>`.

## Layout

| Path | What |
|---|---|
| `CONTEXT.md` | Terms and invariants |
| `docs/00-overview.md` | Planning index |
| `docs/adr/` | Binding decisions |
| `docs/01-architecture.md` | System shape |
| `docs/02-decisions.md` | Why not the alternatives |
| `docs/03-sequences.md` | Request paths |
| `docs/04-dev-plan.md` | Build order |
| `docs/05-operations.md` | Ops questions |

## License

Private. Do not publish the library or credentials.
