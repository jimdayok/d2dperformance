# D2D Marketing website and Site Manager

Next.js 16 application for the DAY2DAY Marketing public website, Brand Discovery flows, and the multi-tenant D2D Site Manager.

## Production architecture

- Primary website: `https://d2dmktg.com`
- Preferred hostname: apex only; `www.d2dmktg.com` permanently redirects to the apex.
- Hosting: Vercel project `jimdayoks-projects/d2dperformance`.
- Legacy website hosts: the apex and `www` versions of `d2dperformance.com` stay attached to Vercel only to provide permanent path-preserving redirects.
- Website-management portal: `https://portal.d2dperformance.com/portal/login` until a separately approved portal-domain migration is completed.
- Email: all `@d2dmktg.com` email remains on ICDSoft. This repository does not migrate email.

## Local development

The repository uses npm and `package-lock.json`.

```bash
npm ci
npm run dev
```

Validation commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Vercel builds use Node.js 24.x. Use a currently supported local Node.js release for development.

## Environment variables

Use `.env.example` as the variable-name inventory. Never commit values.

Public-site and form variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_IDS`
- `NEXT_PUBLIC_META_PIXEL_IDS`
- `CONTACT_FORM_TO_EMAIL`
- `CONTACT_FORM_FROM_EMAIL`
- `BRAND_DISCOVERY_FROM_EMAIL`
- `BRAND_DISCOVERY_TO_EMAIL`
- `BRAND_DISCOVERY_NOTIFICATION_EMAIL`
- `BRAND_DISCOVERY_ALLOWED_ORIGIN`
- `BRAND_DISCOVERY_SESSION_SECRET`
- `RESEND_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_BRAND_DISCOVERY_MODEL`

CMS and portal variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PORTAL_URL`
- `D2D_CMS_SIGNING_PRIVATE_KEY`
- `D2D_CMS_SIGNING_PUBLIC_KEY`
- `D2D_CMS_SIGNING_KEY_ID`

Instagram variables:

- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_SOURCE_ACCOUNT_ID`
- `INSTAGRAM_SHOWCASE_HANDLES`
- `INSTAGRAM_GRAPH_API_VERSION`

The contact form uses Resend and routes notifications through `CONTACT_FORM_TO_EMAIL`. The Brand Discovery flows store configured data in Supabase and use Resend for internal and customer email. If required variables are unavailable, endpoints return a visible failure rather than claiming delivery.

## Domain and redirect strategy

Application-level 308 redirects provide:

- `d2dperformance.com/:path*` to `d2dmktg.com/:path*`
- `www.d2dperformance.com/:path*` to `d2dmktg.com/:path*`
- `www.d2dmktg.com/:path*` to `d2dmktg.com/:path*`

`next.config.ts` contains the explicit old-path map. Query strings are preserved by Next.js and the hostname proxy. Vercel and Cloudflare should not duplicate these redirects.

## Email-hosting warning

Do not remove or modify ICDSoft mail configuration during a website deployment. In particular, do not change:

- MX
- SPF, DKIM, or DMARC
- `mail`, `webmail`, `autodiscover`, or `autoconfig`
- calendar or mailbox records
- domain-verification records
- nameservers or registrar settings

The website cutover is limited to the authoritative apex and `www` web records after Vercel supplies the exact required values.

## Deployment

1. Run all local validation commands.
2. Deploy and verify a Vercel preview.
3. Review the current and proposed domain/DNS table and rollback plan.
4. Obtain explicit production-cutover approval.
5. Deploy with the linked project and explicit team scope:

   ```bash
   npx vercel deploy --prod --yes --scope jimdayoks-projects
   ```

6. Attach and validate the approved domains, apply only the approved website DNS records, and verify certificates.
7. Run HTTP, route, metadata, form, analytics, and responsive smoke tests.
8. Confirm real `@d2dmktg.com` send and receive operation with the mailbox owner.

## Rollback

Keep the ICDSoft site files in place through post-launch monitoring. To roll back the website, restore the prior apex and `www` web records to `192.252.151.38`. Do not change any mail, TXT, service, nameserver, or registrar record.

See [docs/d2dmktg-production-migration.md](docs/d2dmktg-production-migration.md) for the live migration checklist and [docs/site-manager/deployment.md](docs/site-manager/deployment.md) for portal deployment details.
