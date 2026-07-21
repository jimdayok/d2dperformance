# Deployment and configuration

No deployment is automatic. Apply these steps separately to staging and production.

## D2D environment

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PORTAL_URL=https://portal.d2dperformance.com
D2D_CMS_SIGNING_PRIVATE_KEY=
D2D_CMS_SIGNING_KEY_ID=
RESEND_API_KEY=
```

The PEM private key and service-role key are server-only. Preserve existing D2D form/Resend/OpenAI variables documented by the marketing application.

## Alford environment

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CMS_ENABLED=false
D2D_CMS_SIGNING_PUBLIC_KEY=
D2D_CMS_SIGNING_KEY_ID=
D2D_PREVIEW_API_URL=
```

## Supabase

1. Create or select the project; record URL and anon/service keys without committing them.
2. Apply migrations in timestamp order with `supabase db push` or the dashboard SQL editor.
3. Create Auth redirect allowlist entries for local portal callbacks and `https://portal.d2dperformance.com`.
4. Confirm RLS is enabled and run `supabase/tests/site_manager_rls.sql` as the verification role described in that file.
5. Confirm private/public bucket policies, upload limits, and allowed MIME types.
6. Seed Alford with the documented dry-run first, then verify counts and important values.

## Signing keys

Generate an RSA key pair with an approved secret-management workflow. Store the private PEM only in D2D server secrets and the public PEM in Alford server secrets. Assign a non-secret key ID. Never use sample or generated development keys in production.

## DNS and hosting

Add `portal.d2dperformance.com` to the same D2D hosting project, then create the exact CNAME/A record supplied by that host. Keep both marketing hostnames attached. Verify TLS before enabling secure auth callbacks. The hostname-aware proxy rewrites clean portal paths internally and redirects `/portal` on marketing hosts to the portal hostname.

## Release sequence

1. Deploy database migrations and verify isolation.
2. Deploy D2D portal with secrets; create the platform-admin profile through a controlled operator path.
3. Deploy Alford with `CMS_ENABLED=false` and verify every existing route and lead form behavior.
4. Run export, seed, and verification scripts.
5. Test the documented editor-to-publish vertical slice in staging.
6. Enable CMS in staging, compare metadata/structured data/sitemap and visual behavior, then repeat in production.
7. Configure monitoring for preview failures, publish failures, and revalidation events.

Rollback the application by setting `CMS_ENABLED=false`; this immediately returns Alford to version-controlled static fallback without deleting CMS data.

## Exact migration and seed commands

From `d2dperformance` with the Supabase CLI linked to the intended project:

```bash
supabase db push
```

From `alford-custom-builders`, load server credentials into the shell without committing them, then run:

```bash
npm run cms:export -- --dry-run
npm run cms:export
npm run cms:seed -- --dry-run
npm run cms:seed
npm run cms:verify
```

The non-dry seed requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. It inserts missing stable keys and does not overwrite existing editor-owned content on rerun.

## Exact local-development commands

In separate terminals:

```bash
cd /Users/jimday/Documents/GitHub/d2dperformance
npm install
npm run dev
```

```bash
cd /Users/jimday/Documents/GitHub/alford-custom-builders
npm install
CMS_ENABLED=false npm run dev
```

For an integrated local preview, provide the documented Supabase/signing variables to both processes, set Alford `CMS_ENABLED=true`, and use `http://portal.localhost:3000` for the portal. Add `portal.localhost` to the Supabase Auth redirect allowlist if the provider requires exact local URLs.

## Quality commands

Run in each repository:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Current implementation limitations

- The end-to-end editor UI and public-site loader conversion are complete only for the homepage hero vertical slice. Schemas, seed records, navigation, tenant controls, and static fallback loaders exist for the other Alford domains, but their dedicated structured forms and page integration still need implementation before production onboarding.
- Media upload is private and site scoped, but image normalization, dimension extraction, usage-reference reporting, replacement, soft-delete UI, and promotion/copy into the public bucket are not complete.
- Invitation acceptance and role-management mutations are not exposed in the portal yet; membership reads are present and operator-managed Auth setup is required.
- Revalidation JWTs are short-lived and carry a `jti`, but consumed-JTI persistence and a retry button for failed publish events still need a shared production store/workflow.
- SQL tenant-isolation verification and the documented browser vertical slice require a configured disposable Supabase project and two running applications. They cannot be truthfully marked passed without those external credentials and services.
- Journal article detail routes and restricted rich-text editing are modeled but not implemented.
