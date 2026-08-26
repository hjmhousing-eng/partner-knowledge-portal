---
title: Box AI retrieves; Gateway composes
status: accepted
---

# ADR 0004 — Box AI retrieves; Gateway composes

Date: 2026-08-26

## Decision

Ask-the-library tools call Box search and Box AI (or text representation) as-user. AI Gateway runs the writer model, failover, and spend. Answers cite site slugs, not `box.com` file URLs. Responses are not cached.

## Rejected

Download files into OpenAI; Box AI only (no Vercel AI stack); Gateway on raw file bytes.

## Why

Bytes and ACL stay in Box. Gateway is what the assessment grades for failover and cost.

## Consequence

If Box AI is unavailable in the demo tenant, the ask tool falls back to text representation of the shortlist, still as-user.
