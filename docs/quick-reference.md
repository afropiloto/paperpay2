# PaperPay — Quick Reference

## Emails
- Ops: pay@paperpay.money
- Clearing (external): melvin.thoppil@clearing.com
- Resend domain: paperpay.money ✅ verified

## Currencies
GBP, EUR, USD ↔ USDT only

## Rates (hardcoded V1)
- GBP → USDT: 1.2650
- EUR → USDT: 1.0874
- USD → USDT: 0.9990

## Rate Lock
5 minutes (300 seconds)

## Reference format
PP-YYYY-CCY-XXXX (e.g. PP-2026-GBP-0042)

## Roles
- user → /dashboard
- admin → /admin (full access) — pay@paperpay.money
- Melvin → email only, no login

## Two-leg settlement
1. incoming_hash = Melvin → PaperPay wallet
2. outgoing_hash = PaperPay wallet → user wallet
User only ever sees outgoing_hash

## Key API routes
- POST /api/webhooks/deposit — banking webhook
- POST /api/swap/request — create swap + email ops + Melvin
- POST /api/admin/record-hashes — save both hashes + email user

## Brand
PaperPay: #D4FF00 yellow, #0A0A0A bg, Syne + DM Mono
ClearDesk: #3B82F6 blue, #0B0E14 bg, DM Sans + DM Mono

## Stack
Next.js 14 + Supabase + Resend + Vercel + Tailwind + TypeScript

## Deploy
GitHub → Vercel (auto-deploy on push)
Domain: paperpay.money → Vercel DNS
