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
CONTACT_FORM_TO_EMAIL=brand@d2dperformance.com
CONTACT_FORM_FROM_EMAIL=brand@d2dperformance.com
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

Create a table named `brand_discovery_sessions` with at least these columns:

- `id` uuid primary key default `gen_random_uuid()`
- `session_id` text unique
- `contact_name` text null
- `company_name` text null
- `email` text null
- `phone` text null
- `started_at` timestamptz
- `updated_at` timestamptz
- `submitted_at` timestamptz null
- `completion_status` text
- `current_step` integer
- `last_completed_step` integer
- `completion_percentage` integer
- `answers_json` jsonb
- `partial_notification_sent_at` timestamptz null

## Current behavior if env vars are missing

- The submit endpoint will still accept the payload, but no email will be sent and nothing will be stored until the Supabase and Resend environment variables above are configured.
- The AI copilot will stay offline until `OPENAI_API_KEY` is configured.

## Brand Discovery email routing

- `BRAND_DISCOVERY_FROM_EMAIL` is the sender for internal notifications and the customer confirmation email.
- `BRAND_DISCOVERY_NOTIFICATION_EMAIL` and `BRAND_DISCOVERY_TO_EMAIL` are internal routing destinations only and should never be rendered in the public UI.

## Contact form email routing

- `CONTACT_FORM_TO_EMAIL` routes Contact Us form notifications and should be `brand@d2dperformance.com`.
- `CONTACT_FORM_FROM_EMAIL` should be a verified Resend sender for the `d2dperformance.com` domain.
- If `CONTACT_FORM_FROM_EMAIL` is unavailable, the contact route falls back to `BRAND_DISCOVERY_FROM_EMAIL`.

## Brand Discovery draft and notification behavior

- Starting or editing the questionnaire saves a draft session record and does not send an internal email.
- Completing intermediate steps saves draft progress only and does not run the AI summary.
- The full internal Brand Discovery notification email is sent only after final submit.
- A Vercel cron job runs every 15 minutes using `/api/brand-discovery/abandoned`.
- If a session has no activity for 60 minutes, has not been submitted, and has not already been notified, one internal partial-start notification is sent and the session is marked `abandoned_notified`.
