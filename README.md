# Box partner knowledge portal

A Vercel-hosted site in front of a Box library. Authors stay in Box. Readers get pages, previews of site changes, and ask-the-library that cannot see files they cannot open.

This repository is a Solutions Architect take-home. Planning lives in [`docs/`](docs/00-overview.md). Sequence 1 is runnable locally against a fixture library; Box adapters come next.

## Try it

```bash
npm install
npm test
npm run dev
```

1. `/products/welcome` — public, no login.
2. `/products/sku-a/battlecard` while logged out — 404.
3. `/login` with `partner@example.com` / `partner`.
4. Open the battlecard again — 200.

Not on Vercel yet. After deploy, this section will have the public URL.

## Layout

| Path | What |
|---|---|
| `CONTEXT.md` | Terms and invariants |
| `docs/adr/` | Binding decisions |
| `docs/02-decisions.md` | Why not the alternatives (interview) |
| `docs/03-sequences.md` | Request paths |
| `docs/04-dev-plan.md` | Build order |

## License

Private take-home unless the repository visibility says otherwise.
