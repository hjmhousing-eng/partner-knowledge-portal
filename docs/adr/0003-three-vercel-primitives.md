---
title: Three Vercel primitives for MVP
status: accepted
---

# ADR 0003 — Three Vercel primitives for MVP

Date: 2026-08-26

## Decision

MVP uses:

1. Next.js Cache Components
2. Preview Deployments and Rolling Releases (canary is Pro; Hobby can preview and roll back)
3. AI SDK + AI Gateway for ask-the-library

## Rejected

Eve, Workflows, Blob, and a vector DB as MVP scope.

## Why

The brief asks for a few well-chosen pieces. Ask is request-scoped, so Workflows is the wrong failure mode for `/ask`. A corpus copy fights ADR 0001.

## Consequence

Phase 2 may add a Workflows changelog edition and a stub entitlements API. That is additive, not a rewrite. See `docs/02-decisions.md` D12.
