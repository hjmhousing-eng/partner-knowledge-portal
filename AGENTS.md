## Partner knowledge portal

Box is the CMS. This app is the site. Vocabulary is in `CONTEXT.md`. Decisions are in `docs/adr/`. Interview sequences are in `docs/03-sequences.md`.

### Before changing code

Read `CONTEXT.md` and any ADR in the area. Name domain concepts with the glossary, not synonyms.

### While building

Vertical slices: one failing test at a confirmed seam, then the minimum code. Seams are listed in `CONTEXT.md`; do not add a new test surface without saying so.

Comments record *why* (invariants), not what the syntax does.

### Commits

History is part of the take-home. Prefer `feat:` / `fix:` / `docs:` with the invariant in the body when the diff is a decision (cache, ACL, webhook).
