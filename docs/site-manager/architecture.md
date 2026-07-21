# D2D Site Manager architecture

## Decision

D2D Site Manager is a multi-tenant content operations application inside the existing D2D Performance Next.js application. Supabase provides authentication, PostgreSQL, and Storage. Client websites retain their source-controlled presentation and consume only validated published content through a narrow public database function. Draft content is available only through the authenticated D2D preview API.

The platform deliberately edits content, not layouts. Site adapters define fields, schemas, navigation, preview paths, cache tags, and role requirements in version-controlled TypeScript. The first adapter is `alford-custom-homes`; future sites reuse the same tables and portal shell.

## Runtime boundaries

- `d2dperformance.com` and `www.d2dperformance.com`: unchanged marketing routes and chrome.
- `portal.d2dperformance.com`: hostname rewrite to `/portal`, with authentication, tenant-aware navigation, and `noindex` metadata.
- Supabase: auth, tenant data, immutable versions, review notes, publish events, and site-scoped media.
- Alford public site: anonymous read of the `get_published_content` RPC only, Zod validation, cache tags, and static fallback.
- Alford preview: verifies a five-minute asymmetric JWT, enables Draft Mode, and obtains draft data from the D2D preview API.
- Alford revalidation: verifies a short-lived asymmetric JWT and accepts only adapter-approved paths and tags.

## Request flows

### Draft and review

1. A portal Server Component resolves the Supabase cookie session and site membership.
2. An editor form validates locally and submits a mutation to a secured route handler.
3. The handler repeats authentication, tenant authorization, adapter lookup, and Zod validation.
4. The database draft function compares the submitted base revision, updates the draft, and appends an immutable version.
5. Submission changes workflow state to `in_review`; publishing permissions remain separate.

### Preview

1. The portal issues a five-minute RS256 JWT containing `aud`, `siteId`, `siteSlug`, `userId`, `path`, `action`, `iat`, `exp`, and `jti`.
2. Alford verifies signature, key id, audience, site, action, path, and expiry, then enables Next.js Draft Mode.
3. Draft loading calls the D2D preview endpoint with the signed token. Responses are private and `no-store`.
4. Exiting preview clears Draft Mode.

### Publish and revalidation

1. The portal checks publisher permission and validates the draft with the current adapter schema.
2. A PostgreSQL function locks the row, checks expected revision, copies draft to published data, increments revisions, appends a version, and creates a publish event.
3. The portal signs a targeted revalidation JWT and POSTs it to Alford.
4. Alford validates an allowlist and calls Next.js 16 `revalidateTag(tag, { expire: 0 })` and `revalidatePath`.
5. Success or failure is recorded explicitly. A failed revalidation does not roll back the truthful published database state and can be retried.

## Code organization

```text
lib/site-manager/
  registry.ts                 # generic adapter lookup
  types.ts                    # roles, fields, models, site definition
  permissions.ts              # server-side authorization matrix
  validation.ts               # adapter-driven payload validation
  preview.ts                  # signed preview token creation
  publishing.ts               # publish/revalidation orchestration
  sites/alford-custom-homes/
    definition.ts
    navigation.ts
    content-models.ts
    preview-map.ts
    validation.ts
```

Portal UI reads this registry. Database rows carry a stable site slug, while adapter code remains source controlled.

## Audited baseline and risks

- D2D uses Next.js 16.2.9, React 19.2, Tailwind 4, strict TypeScript, and App Router. Supabase JS exists only in server-side form submission code. There is no Auth, SSR client, middleware/proxy, schema migration, or test runner.
- The D2D root layout currently owns marketing header/footer; it must be split without changing public URLs.
- The D2D worktree contained pre-existing contact/report edits when this feature branch was created. Site Manager work avoids overwriting them.
- Alford uses Next.js 16.2.9, React 19.2, Tailwind 4, and GSAP. Content is split between `src/lib/site-data.ts`, page literals, and generated portfolio data.
- Alford has no Supabase dependency or server environment configuration. Static fallback is mandatory during rollout.
- The portfolio generator produces 6 projects and 434 images, but current filenames yield only the room category `Featured Space`. This needs human review before migration is treated as final.
- Alford testimonials are marked temporary in source. They must not be treated as verified customer identities.
- Alford's lead form is currently client-only and logs a payload; CMS work must not silently redefine its recipient or submission integration.

## Deployment assumptions

Both applications are expected to be hosted independently (currently Vercel-compatible). No deployment is performed by this implementation. DNS, Supabase project setup, secrets, redirects, and production smoke tests remain explicit operator steps described in `deployment.md`.
