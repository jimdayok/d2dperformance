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

Add these Vercel environment variables before expecting production submissions to notify and persist:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
BRAND_DISCOVERY_FROM_EMAIL=
BRAND_DISCOVERY_NOTIFICATION_EMAIL=
```

## Required Supabase table

Create a table named `brand_discovery_submissions` with at least these columns:

- `id` uuid primary key default `gen_random_uuid()`
- `submitted_at` timestamptz
- `answers` jsonb
- `summaries` jsonb
- `report_markdown` text

## Current behavior if env vars are missing

The submit endpoint will still accept the payload, but no email will be sent and nothing will be stored until the environment variables above are configured.
