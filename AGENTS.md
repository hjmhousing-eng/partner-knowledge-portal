## Partner knowledge portal

Box is the CMS. This app is the site. Vocabulary is in `CONTEXT.md`. Decisions are in `docs/adr/`. Request paths are in `docs/03-sequences.md`. Write like this is the client repo: no take-home, interview, or assessment framing.

### Before changing code

Read `CONTEXT.md` and any ADR in the area. Name domain concepts with the glossary, not synonyms.

### While building

Vertical slices: one failing test at a confirmed seam, then the minimum code. Seams are listed in `CONTEXT.md`; do not add a new test surface without saying so.

Comments record *why* (invariants), not what the syntax does.

### Commits

Prefer `feat:` / `fix:` / `docs:` with the invariant in the body when the diff is a decision (cache, ACL, webhook). Unslop the message before committing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
