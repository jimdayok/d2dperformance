# D2DP-2610161124 — private D2D Social studio

Server source: /home/jim/staging/d2dperformance, feature/d2d-social-studio-20261016.
Brand Vault source: /home/jim/projects/d2d-brand-vault, feature/social-brand-context-20261016.
Bases: Performance 38855f1; Vault 93d746f. The recovered b3bfae6 candidate is already an ancestor of the Performance base.

Implemented:
- Brand Vault profile fields for brand story, tone of voice and hashtags, with organization-admin authorization and audit events.
- Social brand loader reads those fields, published guideline sections/PDF documents, approved logos and approved image choices, bounded to the authorized organization.
- Platform admins can prepare examples for every active organization without adding social product entitlements. Customer access remains membership/entitlement constrained.
- Photo/video upload to private storage; photo crop/light/logo treatment; carousel output; multiple-photo portrait motion video; uploaded-video start/length trim, portrait crop, light adjustment and logo.
- Scene sliders and questions, plus persisted directions and selections. Existing scenes are not semantically replaced by the local renderer.
- Persistent unscheduled library, caption editing, optimistic revision checks, return-to-studio, drag from library or planned draft onto calendar; explicit Central time choice before saving. Planned library entries are drafts, not live scheduling instructions.
- D2D Social logo in the marketing workspace.
- Administrator-only existing-key connection field, enabled exclusively in server staging. The existing Vercel key is sensitive and cannot be read back through the available token; AI generation remains unverified until the existing key is entered securely. No replacement key was created and no OpenAI generation calls were made.

Staging isolation:
- Separate existing local Supabase databases: d2dperformance and d2d-brand-vault.
- Publishing disabled. No production deployment, approval, social delivery, live database migration or customer notification.
- Local fixtures use existing staging identities. D2D logo copied from actual server website assets; sample photos are existing website portfolio assets, labeled as portfolio examples.
- No fabricated brand story/voice/hashtags left in the database. Temporary round-trip markers were cleared.
- Source/configuration stays on the home server. Mac runs only SSH tunnels and browser review.

Private access on Jim's Mac:
- http://127.0.0.1:13104/portal/marketing
- http://127.0.0.1:13139/app/d2d-marketing/settings/organization
- SSH forward 13104 -> server 127.0.0.1:3104; 13139 -> server 127.0.0.1:3139.
- These are real server builds, not Mac development servers.
- Containers: d2d-social-studio-staging and d2d-brand-vault-studio-staging, host networking, bound to server loopback.
- Original d2d-performance-staging container is stopped and preserved. Its original compose file is unchanged.

Verification evidence: /home/jim/work/social-studio-20261016/
- Build/type/lint logs, targeted tests, API access/persistence checks.
- media-verification.json: actual two-photo carousel, motion video and uploaded-video trim completed and saved as undated drafts.
- brand-context-verification.json: story/voice/hashtags saved through Vault UI and pulled through Social API, then cleared.
- Browser: all six active clients, correct Social logo, scene controls, undated idea save and library listing verified.
- Existing renderer test verifies actual 20-second H.264 portrait video with audio.
- AI live output and live social delivery have not been verified.

Rollback:
- Preserve database-before.dump and vault-before.dump and ignored environment backups (0600).
- Original source bases are retained in Git. Rollback source/build must use those exact commits and original compose configuration; do not restore a database dump over newer work without reconciling it.
- Migration archives, repository-recovery, Artisan source/staging and the portal publisher were not modified.
