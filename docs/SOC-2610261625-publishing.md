# SOC-2610261625 — customer-approved social publishing

The production customer board previously saved approval and a calendar date without handing the approved post to the publishing engine. This change adds a persistent home-server worker and a database-backed delivery journal. Customer approval of a post with a future date schedules that revision; choosing a date for an already approved post also schedules it.

Only explicitly configured organization/platform/account routes can publish. D2D Marketing Facebook and Instagram are configured at installation. Other customers require their own destination mapping; no customer inherits D2D's accounts. Old overdue content is held. Only the two October 26 1:30 PM posts were explicitly admitted for catch-up.

The worker polls every 15 seconds. Uploading and platform processing can add delay. The database claims a due approved revision once, revalidates content/date/approval at dispatch, and prevents mutation after publishing starts. Preparation cancellation preserves a cancelled journal record. Uncertain publish submissions are inspected through GET rather than blindly submitted again. Provider failures and uncertain outcomes require review rather than silently resetting approval.

The customer API returns the delivery state and platform result; badges distinguish preparing, publishing, published, failed and uncertain. A confirmed delivery adds an idempotent activity receipt and does not send an extra email. Existing legacy engine schedules remain separate.

Server service: d2d-social-publisher.service (user jim), enabled at boot with user lingering. Config and credentials live only in /home/jim/services/social-publisher, mode 0600/0700. Source is this isolated server worktree based on verified production eeab1ef5df035b48418dbf43751dbc05db99818d. Database migration preserves the two previous function definitions in the RLS-protected social_delivery_install_backup table. Logs contain delivery IDs/status/errors and no credentials.

Rollback: stop/disable the user service, then remove/disable the configured routes after preserving the delivery journal. Do not restore an old database over delivered records, delete receipts, or automatically retry dispatching/submitted/uncertain deliveries. Keep platform IDs and journal state. Restore backed-up function definitions only after reconciling in-flight publications. Roll back the UI independently to the previous Vercel deployment; a UI rollback alone does not stop the worker.

Validation: isolated database behavior tests cover due claims, duplicates, future dates, approval invalidation, dispatch locks, samples, stale approvals and historical overdue holds. Worker tests cover ambiguous responses, confirmed success, provider failure, draft reconciliation and changed approvals. Existing social review tests and TypeScript validation pass.

