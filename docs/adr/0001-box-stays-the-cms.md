---
title: Box stays the CMS
status: accepted
---

# ADR 0001 — Box stays the CMS

Date: 2026-08-26

## Decision

Authors write in Box. This app reads Box. We do not copy the library to Vercel Blob, a headless CMS, or a vector database.

## Rejected

Migrate to Contentful/Sanity/SharePoint; sync PDFs to S3 for RAG.

## Why

The customer already has Box for versions, collab, DLP, and audit. The bottleneck is the website and its release path, not the cabinet. A second store is a second ACL.

## Consequence

All article IDs in this repo are Box file ids. Invalidation is a Box webhook, not a CMS publish API.
