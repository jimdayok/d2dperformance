# Add a new managed site

1. Create the organization and site records with a stable, unique slug. Use `approval_required` unless the contract explicitly permits client publishing.
2. Add one adapter directory under `lib/site-manager/sites/<slug>`. Define content schemas, field sections, navigation, roles, preview paths, revalidation tags, and allowed internal links.
3. Register the adapter in `lib/site-manager/registry.ts`. Do not add site-specific branches to the generic portal.
4. Add the client application's CMS boundary: published loader, preview loader, Zod schemas, cache tags, and static fallbacks. Page components must call these loaders rather than Supabase.
5. Add signed preview entry/exit and signed revalidation routes to the client app. Store only the public verification key there.
6. Export current content, create legacy media records, and seed draft/published snapshots with immutable initial versions. Provide dry-run and verification commands.
7. Invite users and verify viewer/editor/publisher/site-admin behavior with two distinct tenants.
8. Enable `CMS_ENABLED` only after fallback, preview, publish, metadata, sitemap, and revalidation tests pass in the target environment.

Core tables should not change for a new site. A schema migration is justified only for a platform-wide capability, not for a site's fields.
