---
title: Box AI retrieves; Gateway composes
status: accepted
---

# ADR 0004 — Box AI retrieves; Gateway composes

Date: 2026-08-26

## Decision

Ask-the-library searches Box and asks Box AI (or reads a text representation) as-user before invoking the writer. AI Gateway receives the gated notes once, then runs the writer model, failover, and spend. Answers cite site slugs, not `box.com` file URLs. Responses are not cached.

## Rejected

Download files into OpenAI; Box AI only; Gateway on raw file bytes.

## Why

Bytes and ACL stay in Box. Retrieval before composition limits each question to one Gateway request.

## Consequence

If Box AI is unavailable, the ask tool falls back to a text representation of the shortlist, still as-user.
