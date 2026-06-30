# D2D Performance

## Run locally

```bash
npm install
npm run dev
```

## Brand Discovery backend configuration

The Brand Discovery submission flow is wired for:

- Supabase database storage
- Resend email notifications
- Protected OpenAI-powered AI copilot assistance

Add these Vercel environment variables before expecting production submissions to notify and persist:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
BRAND_DISCOVERY_FROM_EMAIL=
BRAND_DISCOVERY_TO_EMAIL=
BRAND_DISCOVERY_NOTIFICATION_EMAIL=
OPENAI_API_KEY=
OPENAI_BRAND_DISCOVERY_MODEL=gpt-5-mini
BRAND_DISCOVERY_SESSION_SECRET=
BRAND_DISCOVERY_ALLOWED_ORIGIN=https://www.d2dperformance.com
```

## Required Supabase table

Create a table named `brand_discovery_submissions` with at least these columns:

- `id` uuid primary key default `gen_random_uuid()`
- `submitted_at` timestamptz
- `answers` jsonb
- `summaries` jsonb
- `report_markdown` text

## Current behavior if env vars are missing

- The submit endpoint will still accept the payload, but no email will be sent and nothing will be stored until the Supabase and Resend environment variables above are configured.
- The AI copilot will stay offline until `OPENAI_API_KEY` is configured.

## Brand Discovery email routing

- `BRAND_DISCOVERY_FROM_EMAIL` is the sender for internal notifications and the customer confirmation email.
- `BRAND_DISCOVERY_NOTIFICATION_EMAIL` and `BRAND_DISCOVERY_TO_EMAIL` are internal routing destinations only and should never be rendered in the public UI.
