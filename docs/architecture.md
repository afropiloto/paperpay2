# PaperPay — Architecture & Flow

## Overview
PaperPay is a fiat-to-USDT on/off ramp. Users deposit GBP, EUR, or USD into PaperPay's omnibus account and swap in/out of USDT. PaperPay handles FX via an external clearing counterparty (Melvin) and delivers USDT directly to user wallets.

---

## Parties
| Party | Role | Access |
|---|---|---|
| User | Deposits fiat, requests USDT swap | PaperPay dashboard |
| PaperPay (ops) | Manages omnibus, instructs Melvin, pushes USDT to users | ClearDesk admin |
| Melvin | External USDT liquidity provider | Email + WhatsApp only — NO system access |

---

## Full On-Ramp Flow (Fiat → USDT)

```
USER                    PAPERPAY SYSTEM              MELVIN
 |                            |                         |
 | 1. Click Deposit           |                         |
 |--------------------------->|                         |
 |                            |                         |
 | 2. Show bank details       |                         |
 |    + unique ref            |                         |
 |<---------------------------|                         |
 |                            |                         |
 | 3. Send bank transfer      |                         |
 |    (own bank → omnibus)    |                         |
 |                            |                         |
 |            4. Webhook fires (banking partner)        |
 |                            |                         |
 |                    5. Match ref                      |
 |                    Credit balance                    |
 |                            |                         |
 | 6. Email: deposit confirmed|                         |
 |<---------------------------|                         |
 |                            |                         |
 | 7. Request swap            |                         |
 |    amount + wallet addr    |                         |
 |--------------------------->|                         |
 |                            |                         |
 |                    8. Email + WhatsApp ------------->|
 |                       swap details                   |
 |                       PaperPay wallet addr           |
 |                            |                         |
 |                            |   9. Melvin sends USDT  |
 |                            |      to PaperPay wallet |
 |                            |<------------------------|
 |                            |   + incoming hash       |
 |                            |                         |
 |                   10. Admin enters                   |
 |                       incoming_hash in ClearDesk     |
 |                            |                         |
 |                   11. Push USDT from                 |
 |                       PaperPay wallet → user wallet  |
 |                            |                         |
 |                   12. Admin enters                   |
 |                       outgoing_hash in ClearDesk     |
 |                            |                         |
 | 13. Email: USDT sent       |                         |
 |     + outgoing_hash        |                         |
 |<---------------------------|                         |
```

---

## Transaction Status Machine

```
deposit_pending
  → deposit_confirmed    (webhook match)
  → deposit_failed       (no match in 2hrs)

swap_requested
  → swap_processing      (admin picks up)
  → swap_sent            (outgoing_hash recorded)
  → swap_complete        (user confirms / auto)
  → swap_failed          (manual intervention)
```

---

## Rates
Hardcoded in `/lib/rates.ts` — update manually or connect to live feed later.

| Pair | Rate (USDT per 1 unit) |
|---|---|
| GBP/USDT | 1.2650 |
| EUR/USDT | 1.0874 |
| USD/USDT | 0.9990 |

Spread is built into the displayed rate. Raw rate never exposed to user.

---

## Rate Lock
- User selects Rate Lock mode
- Rate frozen for 300 seconds (5 minutes)
- Stored in Supabase with lock_expires_at timestamp
- If submit after expiry → reject, prompt to refresh rate

---

## Reference Format
`PP-YYYY-CCY-XXXX`
- PP = PaperPay
- YYYY = year
- CCY = currency (GBP/EUR/USD)
- XXXX = sequential 4-digit number

Examples: PP-2026-GBP-0042, PP-2026-EUR-0007

---

## Banking Webhook
For V1, banking partner fires:
```json
POST /api/webhooks/deposit
{
  "event": "payment.received",
  "amount": 5000.00,
  "currency": "GBP",
  "reference": "PP-2026-GBP-0042",
  "sender_name": "Alex Thompson",
  "timestamp": "2026-04-14T07:12:00Z"
}
```
Handler verifies signature → matches reference → credits balance → sends email.

Dev simulate button: sends same payload locally for testing.

---

## Email Contacts
- Ops inbox: pay@paperpay.money (Resend verified domain: paperpay.money)
- Clearing: melvin.thoppil@clearing.com (external, receives swap instructions)

---

## WhatsApp (V2)
Provider: 360dialog (direct Meta partner)
Trigger: same events as email
Status: placeholder in V1, wire up post-launch

---

## Infrastructure
| Layer | Service | Cost |
|---|---|---|
| App hosting | Vercel | Free tier |
| Database + Auth | Supabase | Free tier |
| Email | Resend | Free (3k/mo) |
| WhatsApp | 360dialog | ~£5/mo |
| Domain | paperpay.money | Existing |
| DNS | Cloudflare | Free |
