# Box partner knowledge portal

A partner-facing knowledge site backed by Box and hosted on Vercel. Authors publish in Box while readers browse a structured library, open permitted articles, and ask questions against sources they are allowed to access.

Live application: [partner-knowledge-portal.vercel.app](https://partner-knowledge-portal.vercel.app)

## Capabilities

- Public and partner article libraries rendered as web pages.
- Box collaborations enforced for every partner request.
- Markdown article bodies cached with targeted webhook invalidation.
- PDFs delivered directly from Box after the application gate.
- Page-aware Ask with Box search, Box AI retrieval, AI Gateway composition, and portal citations.
- Preview Deployments and application rollback without changing Box files.

## Architecture

Box is the CMS and permission authority. Vercel provides the site, cache, release path, and Ask experience.

Public articles use the application’s Box service account. Partner requests use the reader’s mapped Box identity through an as-user call. The gate runs before a partner body is read from cache, so a shared article cache never grants access.

Markdown bodies are cached by file ID and tagged `doc:{fileId}`. Catalog metadata is cached under `library`. A signed Box webhook invalidates the relevant tags after a file changes. PDF bytes are not cached or proxied through the application; the gated PDF route redirects the browser to a short-lived Box download URL.

Ask is request-scoped and is never cached. It normalizes the question, selects catalog or Box search results, applies the same gate, asks Box AI about the permitted shortlist, and sends the retrieved notes through one AI Gateway writer call. Citations point back to portal article routes.

See [`CONTEXT.md`](CONTEXT.md) for the product vocabulary and security invariants. Binding architecture decisions live in [`docs/adr/`](docs/adr/).

## Local development

Requirements:

- Node.js and npm

Connected development also requires:

- A Box Custom App configured for Client Credentials Grant and as-user access
- An AI Gateway API key for local Ask responses

Install and run:

```bash
npm install
npm test
npm run dev
```

Copy `.env.example` to `.env.local` and add the required credentials. When the Box variables are blank, the application uses its local fixture library.

Useful routes:

- `/` — landing page
- `/library` — public and assigned partner articles
- `/login` — reader sign-in
- `/products/...` — article pages
- `/api/ask` — streamed Ask responses
- `/api/webhooks/box` — signed cache-invalidation events

## Configuration

Box:

- `BOX_CLIENT_ID`
- `BOX_CLIENT_SECRET`
- `BOX_ENTERPRISE_ID`
- `BOX_LIBRARY_FOLDER_ID`
- `BOX_WEBHOOK_SIGNATURE_KEY`

Reader mapping:

- `DEMO_REVIEWERS`, or a gitignored `demo-reviewers.json`
- `BOX_DEMO_PARTNER_USER_ID`, `DEMO_PARTNER_EMAIL`, and `DEMO_PARTNER_PASSWORD` for the single-reader fallback

AI:

- `AI_GATEWAY_API_KEY`
- `ASK_MODEL`
- `ASK_FALLBACK_MODEL`

Operations:

- `REVALIDATE_SECRET` enables the manual revalidation endpoint when webhook delivery is unavailable.

Do not commit `.env` files, Box tokens, reader passwords, or webhook signature keys.

## Box library contract

`BOX_LIBRARY_FOLDER_ID` identifies a library with `public/` and `partner/` child folders.

- Files in `public/` are available without login.
- Files in `partner/` require a Box collaboration.
- Markdown files render as portal articles.
- PDF files render in the portal viewer and are delivered by Box.
- Filenames use `--` to create route segments. For example, `sku-a--battlecard.md` maps to `/products/sku-a/battlecard`.

The current sign-in flow maps application readers to Box App User IDs. Production identity can replace that mapping with enterprise SSO while preserving the same as-user gate.

## Publishing and cache invalidation

Authors update files in Box. The webhook receiver verifies the Box signature, rejects duplicate events, and revalidates the affected document and catalog tags. A content update does not require an application deployment.

If webhook delivery is unavailable, an operator can invalidate one document with:

```text
POST /api/revalidate?secret=<REVALIDATE_SECRET>&fileId=<fileId>
```

The Box Events API can provide reconciliation if the webhook receiver misses an event.

## Verification

Run the repository checks before release:

```bash
npm test
npm run lint
npm run build
```

Verify that:

- Anonymous readers can open public articles but cannot discover partner entries.
- Logged-in readers see only partner articles permitted by Box.
- Direct requests for missing or forbidden partner articles return 404.
- A Box content update invalidates the matching cached body.
- Ask citations resolve to portal routes and never expose inaccessible sources.
- A failed primary writer can use the configured cross-provider fallback.

## Project documentation

- [`docs/00-overview.md`](docs/00-overview.md) — documentation index
- [`docs/01-architecture.md`](docs/01-architecture.md) — system shape
- [`docs/02-decisions.md`](docs/02-decisions.md) — architecture choices and trade-offs
- [`docs/03-sequences.md`](docs/03-sequences.md) — request and publishing sequences
- [`docs/04-dev-plan.md`](docs/04-dev-plan.md) — delivery plan
- [`docs/05-operations.md`](docs/05-operations.md) — operational scenarios
- [`docs/06-demo-script.md`](docs/06-demo-script.md) — solution walkthrough
- [`docs/adr/`](docs/adr/) — binding architecture decisions

## License

Private. Do not publish the library or credentials.
