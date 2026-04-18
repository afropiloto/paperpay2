# PaperPay — Cursor Agent Build Prompt

Build **PaperPay** — a fiat-to-USDT on/off ramp web app with an internal ops dashboard called ClearDesk.

## Stack
- Next.js 14 (App Router)
- Supabase (Postgres + Auth + RLS)
- Resend (email, sending domain: paperpay.money)
- Vercel (deployment, no local server needed)
- Tailwind CSS
- TypeScript

## ENV VARS — create .env.local
```
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
THREESIXTY_DIALOG_API_KEY=placeholder
ADMIN_EMAIL=pay@paperpay.money
CLEARING_EMAIL=melvin.thoppil@clearing.com
NEXT_PUBLIC_APP_URL=https://paperpay.vercel.app
```

---

## Database
Schema is in `/docs/schema.sql` — run this in Supabase SQL Editor before starting.

---

## User Roles
- `user` — standard PaperPay customer
- `admin` — pay@paperpay.money — full ClearDesk access, sees everything
- Melvin (melvin.thoppil@clearing.com) — EXTERNAL ONLY, no system access, receives email + WhatsApp

---

## Business Flow

### On-Ramp (Fiat → USDT)
```
1. User deposits GBP/EUR/USD via bank transfer
   → Unique reference generated: PP-YYYY-CCY-XXXX
   → User shown PaperPay bank details + reference
   → Banking webhook fires on receipt: POST /api/webhooks/deposit
   → Reference matched → balance credited → user notified by email

2. User requests swap
   → Enters amount + destination USDT wallet address
   → Selects Instant or Rate Lock (5 min)
   → Rates: GBP=1.2650, EUR=1.0874, USD=0.9990 USDT per unit
   → Transaction created: status = swap_requested
   → Email sent to pay@paperpay.money AND melvin.thoppil@clearing.com
   → Email contains: user name, ref, amount, currency, rate, USDT out, PaperPay wallet address

3. Melvin executes (external)
   → Melvin converts fiat, sends USDT to PaperPay wallet
   → Melvin sends back incoming on-chain hash

4. Admin records in ClearDesk
   → Enters incoming_hash (Melvin → PaperPay wallet)
   → Pushes USDT from PaperPay wallet to user wallet
   → Enters outgoing_hash (PaperPay → user wallet)
   → Status = swap_sent
   → User notified by email with outgoing_hash only

5. Complete
   → Status = complete
   → User balance updated
```

### Off-Ramp (USDT → Fiat) — V2, placeholder only in V1

---

## Email Templates — send FROM pay@paperpay.money via Resend

### Email 1 — Deposit confirmed (to user)
```
Subject: Your [currency] [amount] has landed — PaperPay
Body:
Hi [name],

Your deposit of [amount] [currency] has been confirmed.

Reference: [payment_reference]

You can now log in and request a swap to USDT.

paperpay.money
```

### Email 2 — New swap request (to pay@paperpay.money + melvin.thoppil@clearing.com)
```
Subject: New swap request — [payment_reference]
Body:
New swap request received.

User: [full_name]
Reference: [payment_reference]
Sending: [amount_in] [currency_in]
Rate: 1 [currency_in] = [rate] USDT
Receiving: [amount_out] USDT
Destination wallet: [wallet_address]
Rate mode: [instant / locked]

Send USDT to PaperPay wallet, then reply with on-chain hash.

Log in to ClearDesk: [NEXT_PUBLIC_APP_URL]/admin
```

### Email 3 — USDT sent (to user)
```
Subject: Your USDT is on the way — PaperPay
Body:
Hi [name],

[amount_out] USDT has been sent to your wallet.

Wallet: [wallet_address]
On-chain hash: [outgoing_hash]

Allow 5–30 minutes for on-chain confirmation.

paperpay.money
```

---

## WhatsApp — placeholder, wire up later
```ts
// lib/whatsapp.ts
export async function sendWhatsApp(to: string, message: string) {
  if (!process.env.THREESIXTY_DIALOG_API_KEY || 
      process.env.THREESIXTY_DIALOG_API_KEY === 'placeholder') {
    console.log('[WhatsApp placeholder]', to, message)
    return
  }
  // 360dialog API — add later
  await fetch('https://waba.360dialog.io/v1/messages', {
    method: 'POST',
    headers: {
      'D360-API-KEY': process.env.THREESIXTY_DIALOG_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to, text: { body: message } })
  })
}
```
Call sendWhatsApp alongside every Resend email. Logs to console in V1.

---

## UI Design

### PaperPay (user dash) — /dashboard
See reference file: `/ui/paperpay-dashboard.html`
- Dark theme: bg #0A0A0A, surface #111111, surface2 #181818
- Primary accent: neon yellow #D4FF00
- Fonts: Syne (Google Fonts) headings/UI, DM Mono for numbers/data
- Sidebar nav: Overview, Swap, Deposit, History, Account
- Balance hero: total in GBP equiv, breakdown GBP/EUR/USD/USDT
- Swap widget: amount, currency, Instant/Rate Lock toggle, wallet input, submit
- Rate lock: 5-min countdown, rate frozen
- Deposit modal: unique reference + bank details per currency
- Transaction history: type, amount, status badge, reference, timestamp
- Notification bell: deposit confirmed, swap sent

### ClearDesk (admin) — /admin
See reference file: `/ui/cleardesk-dashboard.html`
- Dark theme: bg #0B0E14, surface #111520
- Primary accent: #3B82F6 (blue)
- Fonts: DM Sans + DM Mono
- Role-protected: redirect to /dashboard if role = user
- Metrics row: today volume, pending, settled, failed
- Transaction table: user, ref, currency, amount, USDT out, wallet, status, time
- "Record hashes" modal: input incoming_hash + outgoing_hash
- Status badges: Pending / Processing / Sent / Complete / Failed
- Comms log per transaction

---

## File Structure
```
/app
  /page.tsx                         — redirect: authed→/dashboard, unauthed→/login
  /login/page.tsx                   — Supabase auth UI
  /dashboard/page.tsx               — PaperPay overview
  /swap/page.tsx                    — swap widget
  /deposit/page.tsx                 — deposit flow
  /history/page.tsx                 — transaction history
  /admin/page.tsx                   — ClearDesk (role-protected)
  /api
    /webhooks/deposit/route.ts      — inbound payment webhook + simulate button
    /swap/request/route.ts          — create swap + send emails to ops + Melvin
    /admin/record-hashes/route.ts   — save incoming+outgoing hash + notify user
    /admin/update-status/route.ts   — manual status updates

/components
  /ui/                              — Button, Badge, Card, Input, Modal
  /layout/                          — Sidebar, Topbar, MobileNav
  /dashboard/                       — BalanceCard, WalletGrid, TxnList
  /swap/                            — SwapWidget, RateLockTimer
  /deposit/                         — DepositModal, BankDetails, ReferenceDisplay
  /admin/                           — SwapTable, HashModal, MetricsRow, CommsLog

/lib
  /supabase.ts                      — client + server Supabase instances
  /resend.ts                        — all email send functions
  /whatsapp.ts                      — placeholder + 360dialog
  /rates.ts                         — hardcoded rates + spread logic
  /references.ts                    — generate PP-YYYY-CCY-XXXX
  /roles.ts                         — role check helpers
```

---

## Build Order
1. Scaffold Next.js 14 + Tailwind + TypeScript
2. Install deps: `@supabase/supabase-js @supabase/auth-helpers-nextjs resend`
3. Set up .env.local
4. Supabase client (browser + server)
5. Auth — login page, session middleware, profile fetch
6. PaperPay dashboard UI (match /ui/paperpay-dashboard.html exactly)
7. Deposit flow + webhook handler + simulate button
8. Swap flow + Resend emails
9. ClearDesk admin UI (match /ui/cleardesk-dashboard.html exactly)
10. Hash recording + user notification
11. Deploy to Vercel

---

## Deployment
- Push to GitHub → connect to Vercel → auto-deploy
- Add all env vars in Vercel project settings
- Custom domain: point paperpay.money DNS A record to Vercel
- Resend sending domain already verified: paperpay.money
