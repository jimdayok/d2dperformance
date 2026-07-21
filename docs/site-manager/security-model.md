# Security model

## Trust boundaries

- Browser input is untrusted, including site IDs, roles, revisions, paths, MIME types, and JSON payloads.
- Portal route protection improves UX but does not authorize mutations. Every mutation authenticates and authorizes again on the server.
- RLS is the final tenant boundary for browser/session clients.
- The service-role key is server-only and is used only where a narrowly scoped server operation cannot use the caller session.
- Client websites receive only the anonymous key and public verification key. They never receive the service role or signing private key.

## Authorization matrix

| Capability | Viewer | Editor | Publisher | Site admin | Platform admin |
| --- | ---: | ---: | ---: | ---: | ---: |
| Read assigned content | yes | yes | yes | yes | all sites |
| Save draft | no | yes | yes | yes | yes |
| Submit for review | no | yes | yes | yes | yes |
| Publish approval-required site | no | no | yes | no | yes |
| Publish client-can-publish site | no | no | yes | yes | yes |
| Request changes / restore | no | no | yes | mode-dependent | yes |
| Manage tenant users | no | no | no | assigned organization | all |
| Grant platform admin | no | no | no | no | server/operator only |

## RLS design

SQL helper functions (`is_platform_admin`, `is_organization_member`, `has_site_role`, and `can_publish_site`) run with fixed search paths and are not writable by application roles. Policies derive site access from the authenticated user and stored foreign keys; they do not trust a client-supplied organization claim. Anonymous access is denied except execution of the narrow published-content function and public-bucket reads.

Storage policies verify both bucket and first path segment. Upload handlers additionally validate extension, MIME type, size, and image metadata. Allowed initial types are JPEG, PNG, and WebP; executable and SVG uploads are rejected.

## Tokens

Preview and revalidation tokens use RS256 via `jose`, include a `kid`, audience, site identity, action, issue/expiry timestamps, and JWT ID, and expire in about five minutes. The Alford app validates the exact intended action and an adapter-owned path/tag allowlist. Preview responses use `Cache-Control: private, no-store`. Revalidation is POST-only. Replay resistance uses short expiry plus `jti`; production should persist consumed revalidation JTIs when multiple instances make an in-memory cache insufficient.

## Operational requirements

- Enable email confirmation policy deliberately; password login and reset must work without magic-link-only coupling.
- Configure exact portal and preview redirect URLs in Supabase Auth.
- Rotate signing keys by adding a new public key/key ID to clients, switching the portal signer, then retiring the old key after maximum token TTL.
- Never log credentials, JWTs, cookie values, private keys, service keys, or full submitted content bodies.
- Review Supabase advisors after migration and run tenant-isolation verification before production access is invited.

## Known baseline concerns

The existing D2D service-role usage is server-contained. The existing Alford lead form is not a secure production submission integration and remains outside the CMS permission boundary; it needs a separately approved form implementation.
