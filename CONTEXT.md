# Partner knowledge portal

Box is the cabinet. This repo is the website in front of it.

Partners read enablement as pages (`/products/sku-a/battlecard`), not as a folder tree. Authors keep working in Box. Vercel hosts the site, caches article bodies, previews layout changes, and streams ask-the-library through AI Gateway. File bytes stay in Box.

## Status

Live at [partner-knowledge-portal.vercel.app](https://partner-knowledge-portal.vercel.app). Box webhook is registered on Custom App 2662859; HMAC is already in Vercel.

## Vocabulary

Use these terms in code, tests, and commits. Avoid the synonyms in parentheses.

| Term | Means | Avoid |
|---|---|---|
| **library** | The Box folder that is the corpus | drive, tenant, CMS |
| **article** | One published doc shown as a page | asset, blob, record |
| **shell** | Cached nav and chrome | layout (when you mean the cached photocopy) |
| **body** | Article payload from cache or Box | content (too vague) |
| **as-user** | Box API calls with the reader's identity | service account (except public articles) |
| **audience** | `public` or `partner` | visibility, ACL (ACL is Box collab, not this field) |
| **gate** | Per-request permission check before reading cache | middleware auth (too generic) |

## Invariants

1. `getDocument(fileId)` never takes a user id. The **gate** runs first.
2. Partner articles are fetched **as-user**. CCG/service account is only for `audience=public`.
3. Unknown or forbidden articles return **404**, not 403.
4. Ask-the-library is not cached. Tools search Box as-user.
5. Box file versions are not the site rollback. Vercel deployments are.

Binding write-ups: [`docs/adr/`](./docs/adr/) and the interview crib [`docs/02-decisions.md`](./docs/02-decisions.md).

## Test seams (confirm before adding tests)

Per TDD in this repo, tests attach only to these interfaces once we start building:

- `canAccess(reader, fileId)` — yes/no; Box is behind an adapter
- `getDocument(fileId)` — identity-free body; cache tags are an implementation detail
- Box webhook handler — signature fail, duplicate event id, `revalidateTag` for that file id
- Ask tools — search/ask return only ids the reader may see; citations are site slugs

## What stays off this repo

Vercel Blob, a vector index of the library, Workflows in MVP (see ADR 0004).
