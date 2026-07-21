# Database model

All identifiers are UUIDs and all timestamps are `timestamptz`. Tenant-owned rows ultimately reference `sites.organization_id`. Soft deletion is used for content and media; version rows are immutable.

| Entity | Purpose | Important integrity rules |
| --- | --- | --- |
| `profiles` | Auth user projection and platform-admin flag | PK equals `auth.users.id`; users cannot grant themselves platform access |
| `organizations` | Client tenant | unique slug; controlled status |
| `organization_members` | User-to-tenant role | unique organization/user; constrained role |
| `sites` | Website and publish configuration | belongs to organization; unique slug; controlled publishing mode |
| `content_entries` | Current draft and published snapshots | unique site/type/key; optimistic revisions; soft delete |
| `content_versions` | Immutable audit snapshots | unique entry/revision/action; updates/deletes denied |
| `review_notes` | Review discussion | author and resolver audit fields |
| `media_assets` | Site-scoped local or Storage image metadata | site-prefixed path; constrained MIME/source; soft delete |
| `publish_events` | Revalidation delivery audit | captures target, HTTP status, and truthful success/failure |
| `site_invitations` | Expiring role invite | hashed token only; no plaintext token persistence |
| `redirects` | Published slug preservation | unique source path per site; 301/302/307/308 only |

## State rules

Content states are `draft`, `in_review`, `changes_requested`, `published`, and `archived`. Version actions are `created`, `draft_saved`, `submitted`, `changes_requested`, `published`, `restored`, and `archived`.

Draft saves require the revision loaded by the editor. A mismatch raises a conflict and never overwrites a newer draft. Publish runs in one database transaction: lock, permission check, revision check, snapshot copy, version insert, publish event insert. Revalidation is an external follow-up whose result updates the event.

## Public access

Anonymous users cannot select base tables. `get_published_content(site_slug, content_type?, content_key?)` is a hardened security-definer function with a fixed search path, validated arguments, and a narrow return type. It returns site slug, content type/key, published data/revision, and published timestamp only.

## Media strategy

`site-manager-drafts` is private; `site-manager-public` is publicly readable. Authenticated writes are limited to paths beginning with an assigned site UUID. Publishing may copy referenced draft assets into the public bucket. Legacy repository files are recorded as `legacy_local` and are not duplicated during initial migration.

## Source of truth

The executable model is the versioned SQL in `supabase/migrations`. TypeScript types describe application boundaries but do not replace constraints, transactions, or RLS.
