# D2DP-2610161639 — private social review workspace

Home-server checkout: /home/jim/staging/d2dperformance
Branch: feature/d2d-social-review-20261016
Base: 51ea8cb (the current private Social studio, including its existing creative tools).
Scope: internal staging only. No Vercel deployment, real approval, or social network delivery.

## Review experience
- D2D theme and authentic D2D Social logo; full-width social workspace with compact client/account navigation.
- Board, searchable/sortable table, month/week/day/list calendar, platform previews, project notes, feed concept, private media library, and existing Create studio.
- Single post review dialog with media, platform captions, creative direction, per-post activity and feedback.
- Calendar dragging opens the exact post's date/time editor; saving is explicit and Central time is validated by the existing conversion helper.
- Existing saved studio drafts can be copied to In Progress on the review board. The board revision is an independent snapshot; re-importing does not overwrite it.
- Example project uses clearly labeled TEST posts and existing D2D portfolio photographs. Its captions are review examples, not an approved campaign.

## Independent workflow
Each social_review_posts row owns its status, content revision, approved revision, planned time, and activity.
Approving one post does not read or wait for other campaign posts.
Scheduling one approved test post changes only that row. It records a simulated schedule and never contacts Shoutrrr or a social platform.
Editing clears that post's approval. Scheduled test posts must be returned to a draft before editing.
A database transaction locks the selected row and rejects stale revisions and unauthorized roles.
Existing social_content_batches and social_content_items are preserved. The historical batch delivery engine is not used by this workspace.

## Boundaries
- D2D_SOCIAL_REVIEW_STAGING must be true, D2D_SOCIAL_SCHEDULING_ENABLED must not be true, and the server Supabase URL must be loopback.
- API authentication, organization role checks, same-origin writes, RLS reads, and scoped media signing.
- Reviewers see only private media referenced by posts shared onto this board.
- Real-post approval and scheduling are rejected by both the API and the staging database transition function.
- Legacy approval/scheduling server actions also reject in this staging mode.
- New tables and migration applied only to the existing isolated local Supabase database.
- Production rollout and a real delivery adapter require a separately reviewed change; this staging build cannot deliver real posts.

## Verification
Evidence: /home/jim/work/social-review-20261016/
- TypeScript, changed-file ESLint, focused workflow and studio unit tests, actual database transition tests.
- Browser: test post approved and test-scheduled independently, neighbor left pending, separate changes request and feedback saved.
- API: anonymous, foreign origin, cross-client and stale-revision rejections; original legacy table data matches the pre-work backup.
- Final browser checks cover all new views, carousel previews and a narrow viewport.
- Exact commit, Next build ID, browser checks and staging URL are recorded in evidence.json after the final build.

## Access and rollback
Private review: http://127.0.0.1:13104/portal/marketing
The Mac only forwards SSH to server loopback port 3104; all source, build output and databases remain on dev-services.
The review browser uses the existing isolated staging administrator session, not a production login.
Database snapshot, original environment and previous .next build are preserved in the evidence directory.
Rollback: stop the staging app, restore the previous build and environment, restart it. Keep the new additive tables unless reconciliation confirms they can be removed; do not overwrite newer studio work with an old database dump.
