# Social release — October 18, 2026

Reviewed mobile and desktop social workspace, based on verified production commit 13d327f67510b57133dd9d9254d9b53aec19f485. Preserves the current footer, signed customer connector and existing legacy posting workflow. Release record D2DP-2610181907.

## Production scope

Explicit D2D_SOCIAL_REVIEW_MODE=production enables organization-scoped review, private media, per-post decisions, revision locks, calendar planning and durable email notifications. Guest links are post-scoped, hashed, revocable and expire after 48 hours, with write rate limits. Clients cannot schedule through guest links. Production and staging retain separate mode guards; staging remains test-only.

Approvals and calendar planning do not publish to a social network. Automatic posting is OFF in this new workspace. Earlier campaigns and their posting integration remain available under Previous campaigns; no records are imported or duplicated automatically. Samples never send email or publish. Publication-preview actions remain sample-only. Actual network publication and its delivery confirmations are outside this release.

Email sender is D2D Marketing <socialpages@d2dmktg.com>. Submission requires configured client recipients and a configured D2D email transport. Staff and client notifications are separately routed, claimed atomically and sent with stable idempotency keys. Provider acceptance and failures are recorded. Failed/uncertain messages are not automatically retried. Per-client recipients must be set in Emails before submitting a real review request. No launch email or real post approval is part of validation.

## Database and recovery

Production project d2dperformance / jxawbtbtjenurksrjhqf verified through the authenticated Supabase dashboard. Six reviewed migrations applied in one transaction. Private backup social_review_launch_backup retains the previous AI-reservation function and legacy fingerprints. All 44 legacy items retain hash 36909038252835e6e1599c3c16844f02 after installation. 32 existing provider-linked items remain untouched. Runtime production flag remains separately controllable in social_review_runtime; schema is additive and rollback does not require deleting content.

Rollback: disable the new review runtime flag and production mode environment flag, then restore the exact prior Vercel deployment through Release Center. Retain new records, outbox and migration history; never drop production data as part of deployment rollback. Restore the backed-up AI-reservation function only if its change is implicated and after checking current version.

## Evidence

Server evidence directory /home/jim/work/social-live-readiness-20261018 contains transaction SQL/hash, before/after verification, isolated PostgreSQL tests and source checks. Isolated tests verify guest scope, revoked links, stale revisions, edit invalidation, approval preservation when dates change, production email queue routing, sender identity, disabled network publication and staging guards. Email transport tests use mocks; actual sender readiness must be checked on the built candidate before publication. No real approval, reschedule, email or network post is required for go-live checks.

Production transport check: existing Resend credential is intentionally send-only (provider returns that exact restriction on domain listing). Preserve least privilege. Only that explicit response permits sending without the read-only domain check; the provider validates the fixed D2D sender on every send. An invalid key, other lookup errors or a known unverified domain remains blocked. No email was sent as a launch test. Provider acceptance is not represented as recipient delivery.
