# PaperPay — Cursor Agent Instructions

## READ THIS FIRST

This folder contains everything needed to build PaperPay from scratch.

## Step 1 — Run the database schema
Go to https://supabase.com → your project → SQL Editor
Paste and run: `docs/schema.sql`

## Step 2 — Environment variables
The `.env.local` file is already populated with all keys.
Copy it to your Next.js project root.

## Step 3 — Start building
Read `CURSOR_PROMPT.md` — this is your full build spec.
Paste it into Cursor Agent and say: "Build this exactly."

## Step 4 — UI reference
The `/ui/` folder has the exact HTML mockups to match:
- `paperpay-dashboard.html` — user facing app
- `cleardesk-dashboard.html` — admin ops dashboard

Open these in a browser to see exactly what to build.
Tell Cursor: "Match the UI in /ui/ exactly — colours, fonts, layout."

## Step 5 — Deploy
Push to GitHub → connect to Vercel → add env vars in Vercel dashboard → deploy.
Point paperpay.money DNS to Vercel.

## File map
```
.env.local                  ← all API keys and config (ROTATE AFTER BUILD)
CURSOR_PROMPT.md            ← full build spec — paste into Cursor Agent
README.md                   ← this file
ui/
  paperpay-dashboard.html   ← PaperPay user dash UI reference
  cleardesk-dashboard.html  ← ClearDesk admin dash UI reference
docs/
  schema.sql                ← run in Supabase SQL Editor
  architecture.md           ← full flow diagrams and logic
  quick-reference.md        ← rates, emails, roles, brand colours
```

## Key contacts
- Ops email: pay@paperpay.money
- Clearing (external): melvin.thoppil@clearing.com
- Supabase project: https://nwljvrtngkoycdwqjiel.supabase.co

## ⚠️ After build is complete
Rotate ALL keys in .env.local:
- Supabase: dashboard → Settings → API → regenerate
- Resend: resend.com → API keys → revoke and create new
- Update Vercel env vars with new keys
