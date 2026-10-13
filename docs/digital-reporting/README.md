# D2D Digital Performance Reporting

Implemented in `d2dperformance`, based on the D2D Admin/customer platform commit `c07ade0`. The authoritative public marketing checkout was on an older Cart Convoy branch and did not contain the current customer administration. Quote Studio is a different repository/application.

## Workflow and guarantees

- `/portal/reports`: administrator workspace and customer report library; linked from the existing administration headquarters and shared portal navigation.
- Enrollment uses existing `organizations`, not a new competing customer directory. Supports enabled/disabled, monthly enabled/disabled, 1–10 recipient emails, complimentary/paid initial audit and an explicitly entered USD fee, reporting start month, proposal reference.
- Generate stores a real branded PDF, immutable JSON snapshot, SHA-256 digest and numbered version. Old versions cannot be updated or deleted by the application. The private PDF download endpoint requires a session and enforces row-level authorization; no public report URLs or storage buckets.
- Separate buttons: Generate, Preview PDF, Mark reviewed, Approve PDF, Send Report. Review and approval are recorded, but neither calls email delivery. The same administrator can review and approve; this is not a two-person approval requirement.
- Approval establishes the initial audit baseline immediately. Baseline version and content remain immutable even if an audit PDF is reissued for changed recipients. Additional evidence belongs in subsequent reports, not silently rewritten into the baseline.
- Monthly reports include the original baseline and the immediately preceding approved monthly period when available. A missing prior month is labeled unavailable, not replaced with an arbitrary older report. Changes across different source/property or method/filter strings are marked not comparable. Totals are not normalized for different month lengths.
- Editing content regenerates a version and clears review/approval. Enrollment changes invalidate pending approval; regenerate and review again. Previously released versions remain accessible to clients. A corrected monthly report requires a new version and another manual send.
- A customer-scoped transaction lock and expected version/enrollment revision checks reject concurrent/stale writes. A unique delivery attempt per PDF version prevents duplicate clicks. Email uses a stable provider idempotency key.
- The initial audit must be accepted by the provider for all current recipients before a monthly report can be released. Added recipients require an audit reissue first.
- Before Send Report, the server checks authorization, PDF integrity, current approval, active enrollment and exact recipients. PDF attachments are the saved approved bytes, never freshly rendered during delivery.
- `accepted` means the email provider accepted the request. It does not claim inbox delivery. Rejection is `failed`; a timeout/unknown outcome is `uncertain`. Pending/uncertain attempts block changes and resends. The reconciliation form records independently checked provider evidence without sending. After confirmed rejection, generate a new PDF version, review, approve, and explicitly send again.
- Report versions, event trail and delivery records are customer scoped. Only administrators can read drafts or mutate reporting. Organization members can read exact provider-accepted versions; other organizations cannot access them. No authenticated direct table writes are granted.

## Recurring monthly preparation

`/api/digital-reports/prepare-monthly` requires `Authorization: Bearer <CRON_SECRET>`. `vercel.json` schedules it at 14:00 UTC on the first of the month (8 a.m. CST / 9 a.m. CDT). It uses America/Chicago to select the last completed reporting month, skips inactive/unapproved/not-yet-started customers, and never overwrites an existing report. An existing platform administrator UUID must be configured as `DIGITAL_REPORT_AUTOMATION_ACTOR_ID`; the database allows the automation identity to create drafts only. No email module is imported by preparation. Baseline month and earlier months are skipped. Admins can backfill missed monthly periods manually.

The recurring draft marks every metric unavailable until an account manager supplies evidence. This is intentional: analytics connections are not implemented or falsely implied by the cron schedule.

## Sources and external setup

19 metrics cover SEO (Search Console), AI mentions/citations (documented prompt panels), website users/sessions/views/engagement (GA4), qualified leads/forms/calls/bookings/conversion (CRM, form, booking and call providers), and technical health (CrUX/crawl). Each metric has value, status, source/property, evidence reference, collection timestamp, method/filter/prompt scope and a missing-data reason. Verified values require evidence and timestamp; unavailable values must be null with a reason. Percentages are restricted to 0–100. The report uses evidence supplied by administrators; this does not independently validate imported analytics exports.

Not implemented: OAuth to GA4/Search Console; property discovery; automatic CRM/call/booking ingestion; CrUX or crawl fetching; live AI prompt execution; email delivery/bounce webhooks. These need provider credentials, customer consent/access, agreed lead definitions, prompt panels and measurement contracts. Existing OpenAI credentials do not automatically establish trustworthy AI visibility measurements.

## Deployment prerequisites (not applied by this change)

1. Back up and review the target Supabase schema; apply `supabase/migrations/202610130001_digital_performance_reports.sql` after the existing customer-platform migrations. Use the SQL migration only once.
2. Confirm existing Supabase auth and server service-role configuration for the same D2D Admin project.
3. Configure `RESEND_API_KEY`, a verified `DIGITAL_REPORT_FROM_EMAIL`, `CRON_SECRET`, and `DIGITAL_REPORT_AUTOMATION_ACTOR_ID`. Keep them server-only and separate for preview/production. No credentials belong in source or reports.
4. Review/deploy this branch, verify administrator and customer sessions against the target database, then prepare an audit using actual evidence. Complete a delivery test only to an explicitly authorized test recipient. No customer emails have been sent during development.
5. Verify provider acceptance in Resend. Inbox delivery requires additional provider evidence; the UI deliberately does not claim it.

## Quote Studio / proposals

An enrollment stores the Quote Studio proposal number/reference and prints it in each report. The reporting module appears in the customer portal after release. It does not automatically enroll a client after proposal acceptance: the current Quote Studio quote model has no shared `organization_id`, and its application/database identity must first be mapped to the D2D Admin customer organization. Blind email/name matching is unsafe.

Proposal copy usable in an explicitly priced custom line item:

> Digital Performance Reporting includes an initial Digital Visibility & Website Audit that establishes the approved measurement baseline, followed by monthly branded PDF reports comparing available SEO, AI visibility, website utilization, lead and technical data with the baseline and prior period. Reports identify sources and unavailable data, summarize completed work and next priorities, and require D2D review, approval and a separate manual release. Third-party measurement access and customer authorization are required for connected metrics. Reporting does not guarantee rankings, AI mentions, traffic or leads.

Do not invent catalog pricing. Initial audit free/paid terms are explicitly entered in Admin; billing/invoicing remains in the existing financial system. Acceptance-to-enrollment automation and quote catalog billing are deferred pending an explicit shared customer identifier and approved commercial scope.

## Validation

`npm run test:reporting` runs evidence/PDF tests, delivery tests with a mocked email provider (no real email), and the actual migration in embedded PostgreSQL/PGlite with administrator/customer/outsider identities and RLS. It validates baseline and version immutability, separate review/approval/send, enrollment invalidation, duplicate/stale send prevention, accepted-version client visibility, cross-tenant denial and draft-only automation. `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` cover the wider application. The existing registry test was updated to include the already registered D2D Marketing site from the base commit.

The migration has been exercised in embedded PostgreSQL, not the production Supabase project. Live auth, provider delivery, customer data and deployed cron behavior require the deployment checks above.

## Client template revision (October 12, 2026)

The PDF renderer now produces two distinct client-facing layouts: Initial Digital Review and Monthly Digital Review. Both use the updated D2D mark from the October 12 logo revision, embedded as an image rather than approximated with text. Each sample has four main pages (overview, discovery, website/inquiries, action plan) and two supporting pages (additional measures and sources). Longer actual account narratives and evidence may require additional pages; text and tables paginate automatically.

Client language replaces technical labels: website users become people who visited the website; organic clicks become visits from Google search; the baseline becomes the starting point; and technical loading measures are described by the visitor experience. Initial tables show a starting result only. Monthly tables show starting point, last month and this month. Percentage changes, when explained, use percentage points. Changes in source/counting rules are marked so unlike results are not treated as fair comparisons. Supporting records, source, date checked and counting rules remain available at the back. Missing measurements remain explicitly marked, and no sample performance results are fabricated.

The two review PDFs are template drafts, not completed customer reports. Existing saved PDF versions are not rewritten; newly generated reports use the revised renderer. This revision does not send email, change approval requirements or deploy the application.

## Graphs, icons and customer personalization

New reports include a dedicated graph page for website visitors, unpaid Google search visits and confirmed inquiries. Initial reports plot the starting result only. Monthly reports compare the original starting result, prior month and current month. Bars start at zero, have direct count/date labels, and use an independent scale for each measure. Missing results stay blank; results counted with different sources or methods are not plotted as fair comparisons. Main section headings and summary cards use small vector icons that remain sharp in print.

The administrator can upload a PNG, JPG or WebP customer logo under **Personalize the report** after saving the customer's enrollment. Uploads are limited to 2 MB and 4 million pixels, validated by file signatures and decoding, converted to a bounded PNG, and stored privately per organization with an integrity digest. SVG and remote image URLs are not accepted. The saved logo appears alongside D2D on every newly generated page and is included in the immutable report snapshot. Changing or removing a logo increments the customer's settings revision and invalidates pending approval. Previously saved/released PDFs retain the original logo. Reissuing audit branding does not replace the original measurement baseline. Pending/uncertain delivery prevents logo changes until reconciliation.

Apply the additive `supabase/migrations/202610130002_digital_report_branding.sql` **after** the original reporting migration before deploying this revision. This migration has been tested in embedded PostgreSQL but has not been applied to production.

The Alford review PDFs are explicitly labeled **DESIGN EXAMPLE / SAMPLE DATA** on every page, with an illustration caption on each graph and a cover explanation. They use Alford's existing website logo, resized without changing the artwork. Their example figures are not Alford performance measurements and are never saved as customer reports or emailed. Sample-data rendering requires the explicit review-copy option, which is not exposed by the report API or monthly preparation job. Actual reports use the customer's saved logo and supplied evidence only.
