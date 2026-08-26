---
title: Document cache is identity-free
status: accepted
---

# ADR 0002 — Document cache is identity-free

Date: 2026-08-26

## Decision

`getDocument(fileId)` may use Cache Components (`use cache` + `cacheTag('doc:'+fileId)`). It must not receive `userId`. `canAccess(reader, fileId)` runs on every request and is not stored in that cache.

## Rejected

SSR every article with no cache; cache `getDocument(userId, fileId)`; fetch partner files as a service account.

## Why

A shared cache keyed by user explodes or leaks. A service account for partner files skips Box collab. Full SSR throws away the static-shell story.

## Consequence

Public articles may use CCG. Partner articles use as-user. Forbidden routes return 404.
