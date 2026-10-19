# Existing social posts in the new workspace

Release D2DP-2610182003. Based on verified production 03d9515a988454225b5e9411e1951ba09840631d / dpl_4Ecx9Ej7XGUA3GiFqQUoffdoDW4X.

Import each existing platform post once, with the original item ID as its review ID and a unique foreign key to the source. Preserve current_revision, approved_revision, scheduled_for (timestamptz without conversion), created_by, original timestamps, caption, ordered media, campaign designation and existing publishing ID. Store full original item/batch snapshots in a private RLS-protected recovery table. The original legacy records are not updated or deleted.

Import is explicit, service-only and organization-scoped. Re-running it inserts zero duplicates and never overwrites edits in the new board. Invalid scheduled approvals, identity collisions or unsupported published/archived history cause a transaction failure rather than guessing. There is no publishing call, approval transition, synthetic activity, client invitation or email during import.

The new board becomes the review workspace for imported posts. Old batch approval/scheduling and legacy content writes are blocked for handed-off records, preventing stale batch approval from publishing a second copy. Publishing metadata and prior history remain intact. Existing active scheduled records remain protected in the new board/calendar, with a Manage live delivery link; they cannot be silently moved, unscheduled or edited through a planning-only workflow. Pending imported posts can be reviewed and revised individually. Approval does not publish. New publishing integration remains off.

Original campaign media URLs are reused, including carousel order and video recognition; no asset copies or publishing records are created. Replacing creative removes the fallback original media so stale images cannot reappear. Both staff and post-scoped guest previews use the same media handling.

Validation: isolated PostgreSQL transaction covers source preservation, exact date/revision/approval/provider mapping, repeat-import safety after edits, cross-organization scope, import permissions, active-schedule protection, old-approval rejection, retained-media submission and explicit creative replacement. Unit tests cover media handling and lock semantics. Full release checks independently compare existing unrelated test failures to the exact production baseline.

Recovery: retain imported rows and snapshots. Reverting only the website deployment does not transfer new edits back to old records. If a return to old batch management is necessary, reconcile new revisions and approvals with snapshots first, then explicitly disable handed_off_review_item and handed_off_review_batch triggers for that recovery. Never delete new reviews to force a rollback; preserve client feedback and approval evidence. The scheduled provider records are untouched throughout.

Evidence and exact production migration/import verification: /home/jim/work/social-legacy-import-20261018/.
